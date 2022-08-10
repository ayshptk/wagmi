import {
  ReadContractConfig,
  ReadContractResult,
  deepEqual,
  parseContractResult,
  readContract,
} from '@wagmi/core'
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import * as React from 'react'
import { QueryFunctionContext, hashQueryKey } from 'react-query'

import { QueryConfig } from '../../types'
import { useBlockNumber } from '../network-status'
import { useChainId, useInvalidateOnBlock, useQuery } from '../utils'

export type UseContractReadConfig<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TResponse extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'outputs'>
  >,
> = ReadContractConfig<TAbi, TFunctionName, TArgs> & {
  /** If set to `true`, the cache will depend on the block number */
  cacheOnBlock?: boolean
  /** Subscribe to changes */
  watch?: boolean
} & QueryConfig<ReadContractResult<TAbi, TFunctionName, TResponse>, Error>

function queryKey<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
>(
  {
    addressOrName,
    args,
    chainId,
    contractInterface,
    functionName,
    overrides,
  }: // Force `args` to any type so react-query can infer it's existence.
  // This is fine because type-safety comes from the outer function signature.
  // If we expose `queryKey` to users, we will want to add `TArgs` in.
  ReadContractConfig<TAbi, TFunctionName, any | undefined>,
  { blockNumber }: { blockNumber?: number },
) {
  return [
    {
      entity: 'readContract',
      addressOrName,
      args,
      blockNumber,
      chainId,
      contractInterface,
      functionName,
      overrides,
    },
  ] as const
}

async function queryFn<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TResponse extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'outputs'>
  >,
>({
  queryKey,
}: QueryFunctionContext<
  readonly [ReadContractConfig<TAbi, TFunctionName, TArgs>]
>) {
  return await readContract<TAbi, TFunctionName, TArgs, TResponse>(queryKey[0])
}

export function useContractRead<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TResponse extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'outputs'>
  >,
>({
  addressOrName,
  contractInterface,
  functionName,
  args,
  chainId: chainId_,
  overrides,
  cacheOnBlock = false,
  cacheTime,
  enabled: enabled_ = true,
  isDataEqual = deepEqual,
  select,
  staleTime,
  suspense,
  watch,
  onError,
  onSettled,
  onSuccess,
}: UseContractReadConfig<TAbi, TFunctionName, TArgs, TResponse>) {
  const chainId = useChainId({ chainId: chainId_ })
  const { data: blockNumber } = useBlockNumber({
    enabled: watch || cacheOnBlock,
    watch,
  })

  const queryKey_ = React.useMemo(
    () =>
      queryKey<TAbi, TFunctionName>(
        {
          addressOrName,
          args,
          chainId,
          contractInterface,
          functionName,
          overrides,
        },
        { blockNumber: cacheOnBlock ? blockNumber : undefined },
      ),
    [
      addressOrName,
      args,
      blockNumber,
      cacheOnBlock,
      chainId,
      contractInterface,
      functionName,
      overrides,
    ],
  )

  const enabled = React.useMemo(() => {
    let enabled = Boolean(enabled_ && addressOrName && functionName)
    if (cacheOnBlock) enabled = Boolean(enabled && blockNumber)
    return enabled
  }, [addressOrName, blockNumber, cacheOnBlock, enabled_, functionName])

  useInvalidateOnBlock({ enabled: watch && !cacheOnBlock, queryKey: queryKey_ })

  return useQuery(queryKey_, queryFn, {
    cacheTime,
    enabled,
    isDataEqual,
    queryKeyHashFn([{ contractInterface: _contractInterface, ...rest }]) {
      return hashQueryKey([rest])
    },
    select(data) {
      const result = parseContractResult({
        contractInterface,
        data,
        functionName,
      })
      return select ? select(result) : result
    },
    staleTime,
    suspense,
    onError,
    onSettled,
    onSuccess,
  })
}
