import {
  FetchSignerResult,
  PrepareWriteContractConfig,
  PrepareWriteContractResult,
  Signer,
  prepareWriteContract,
} from '@wagmi/core'
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import { QueryFunctionContext, hashQueryKey } from 'react-query'

import { QueryConfig } from '../../types'
import { useSigner } from '../accounts'
import { useChainId, useQuery } from '../utils'

export type UsePrepareContractWriteConfig<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
> = PrepareWriteContractConfig<TAbi, TFunctionName, TArgs, TSigner> &
  QueryConfig<
    PrepareWriteContractResult<TAbi, TFunctionName, TArgs, TSigner>,
    Error
  >

function queryKey<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TSigner extends Signer = Signer,
>(
  {
    args,
    addressOrName,
    contractInterface,
    functionName,
    overrides,
  }: // Force `args` to any type so react-query can infer it's existence.
  // This is fine because type-safety comes from the outer function signature.
  // If we expose `queryKey` to users, we will want to add `TArgs` in.
  PrepareWriteContractConfig<TAbi, TFunctionName, any | undefined, TSigner>,
  {
    chainId,
    signer,
  }: { chainId?: number; signer?: FetchSignerResult<TSigner> },
) {
  return [
    {
      entity: 'prepareContractTransaction',
      addressOrName,
      args,
      chainId,
      contractInterface,
      functionName,
      overrides,
      signer,
    },
  ] as const
}

function queryFn<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
>({ signer }: { signer?: FetchSignerResult }) {
  return async ({
    queryKey,
  }: QueryFunctionContext<
    readonly [PrepareWriteContractConfig<TAbi, TFunctionName, TArgs, TSigner>]
  >) => {
    return await prepareWriteContract({
      ...queryKey[0],
      signer,
    })
  }
}

/**
 * @description Hook for preparing a contract write to be sent via [`useContractWrite`](/docs/hooks/useContractWrite).
 *
 * Eagerly fetches the parameters required for sending a contract write transaction such as the gas estimate.
 *
 * @example
 * import { useContractWrite, usePrepareContractWrite } from 'wagmi'
 *
 * const { config } = usePrepareContractWrite({
 *  addressOrName: '0xecb504d39723b0be0e3a9aa33d646642d1051ee1',
 *  contractInterface: wagmigotchiABI,
 *  functionName: 'feed',
 * })
 * const { data, isLoading, isSuccess, write } = useContractWrite(config)
 *
 */
export function usePrepareContractWrite<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
>({
  addressOrName,
  contractInterface,
  functionName,
  args,
  overrides,
  cacheTime,
  enabled = true,
  staleTime,
  suspense,
  onError,
  onSettled,
  onSuccess,
}: UsePrepareContractWriteConfig<TAbi, TFunctionName, TArgs, TSigner>) {
  const chainId = useChainId()
  const { data: signer } = useSigner<TSigner>()

  const prepareContractWriteQuery = useQuery(
    queryKey<TAbi, TFunctionName, TSigner>(
      {
        addressOrName,
        contractInterface,
        functionName,
        args,
        overrides,
      },
      { chainId, signer },
    ),
    queryFn<TAbi, TFunctionName, TArgs, TSigner>({ signer }),
    {
      cacheTime,
      enabled: Boolean(enabled && signer),
      queryKeyHashFn([
        { contractInterface: _contractInterface, signer, ...rest },
      ]) {
        // @ts-expect-error accessing "private" `_address` property
        return hashQueryKey([rest, signer?._address])
      },
      staleTime,
      suspense,
      onError,
      onSettled,
      onSuccess,
    },
  )
  return Object.assign(prepareContractWriteQuery, {
    config: {
      addressOrName,
      args,
      contractInterface,
      overrides,
      functionName,
      request: undefined,
      mode: 'prepared',
      ...prepareContractWriteQuery.data,
    } as PrepareWriteContractResult<TAbi, TFunctionName, TArgs, TSigner>,
  })
}
