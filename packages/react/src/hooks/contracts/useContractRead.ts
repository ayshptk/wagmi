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
import { ContractInterface } from 'ethers/lib/ethers'
import * as React from 'react'
import { QueryFunctionContext, hashQueryKey } from 'react-query'

import { QueryConfig } from '../../types'
import { useBlockNumber } from '../network-status'
import { useChainId, useInvalidateOnBlock, useQuery } from '../utils'

type UseContractReadConfig<
  TAbi,
  TFunctionName extends TAbi extends Abi
    ? ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>
    : string,
  TArgs extends TAbi extends Abi
    ? AbiParametersToPrimitiveTypes<
        ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
      >
    : any[],
> = ReadContractConfig<TAbi, TFunctionName, TArgs> & {
  /** If set to `true`, the cache will depend on the block number */
  cacheOnBlock?: boolean
  /** Subscribe to changes */
  watch?: boolean
} & QueryConfig<ReadContractResult, Error>

function queryKey<
  TAbi,
  TFunctionName extends TAbi extends Abi
    ? ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>
    : string,
  TArgs extends TAbi extends Abi
    ? AbiParametersToPrimitiveTypes<
        ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
      >
    : any[],
>([
  { addressOrName, args, chainId, contractInterface, functionName, overrides },
  { blockNumber },
]: [ReadContractConfig<TAbi, TFunctionName, TArgs>, { blockNumber?: number }]) {
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
  TAbi extends Abi | any[],
  TFunctionName extends TAbi extends Abi
    ? ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>
    : string,
  TArgs extends TAbi extends Abi
    ? AbiParametersToPrimitiveTypes<
        ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
      >
    : any[],
>({
  queryKey,
}: QueryFunctionContext<
  readonly [ReadContractConfig<TAbi, TFunctionName, TArgs>]
>) {
  return (await readContract<TAbi, TFunctionName, TArgs>(queryKey[0])) ?? null
}

export function useContractRead<
  TAbi extends Abi | ContractInterface,
  TFunctionName extends TAbi extends Abi
    ? ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>
    : string,
  TArgs extends TAbi extends Abi
    ? AbiParametersToPrimitiveTypes<
        ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
      >
    : any[],
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
}: UseContractReadConfig<TAbi, TFunctionName, TArgs>) {
  const chainId = useChainId({ chainId: chainId_ })
  const { data: blockNumber } = useBlockNumber({
    enabled: watch || cacheOnBlock,
    watch,
  })

  const queryKey_ = React.useMemo(
    () =>
      queryKey<TAbi, TFunctionName, TArgs>([
        {
          addressOrName,
          args,
          chainId,
          contractInterface,
          functionName,
          overrides,
        },
        { blockNumber: cacheOnBlock ? blockNumber : undefined },
      ]),
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
