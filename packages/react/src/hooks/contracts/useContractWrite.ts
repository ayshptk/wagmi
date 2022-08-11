import {
  Signer,
  WriteContractArgs,
  WriteContractPreparedArgs,
  WriteContractResult,
  writeContract,
} from '@wagmi/core'
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import * as React from 'react'
import { useMutation } from 'react-query'

import { MutationConfig } from '../../types'

export type UseContractWriteArgs<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
> = Omit<
  WriteContractArgs<TAbi, TFunctionName, TArgs>,
  'args' | 'mode' | 'request'
> &
  (
    | {
        /**
         * `recklesslyUnprepared`: Allow to pass through unprepared config. Note: This has harmful
         * [UX pitfalls](https://wagmi.sh/docs/prepare-hooks/intro#ux-pitfalls-without-prepare-hooks), it is highly recommended
         * to not use this and instead prepare the config upfront using the `usePrepareContractWrite` hook.
         *
         * `prepared`: The config has been prepared with parameters required for performing a contract write
         * via the [`usePrepareContractWrite` hook](https://wagmi.sh/docs/prepare-hooks/usePrepareContractWrite)
         * */
        mode: 'prepared'
        /** The prepared request to perform a contract write. */
        request: WriteContractPreparedArgs['request'] | undefined
        args?: never
      }
    | {
        mode: 'recklesslyUnprepared'
        request?: never
        args?: WriteContractArgs<TAbi, TFunctionName, TArgs>['args']
      }
  )

export type UseContractWriteMutationArgs<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
> = {
  /**
   * Recklessly pass through unprepared config. Note: This has
   * [UX pitfalls](https://wagmi.sh/docs/prepare-hooks/intro#ux-pitfalls-without-prepare-hooks),
   * it is highly recommended to not use this and instead prepare the config upfront
   * using the `usePrepareContractWrite` function.
   */
  recklesslySetUnpreparedArgs?: WriteContractArgs<
    TAbi,
    TFunctionName,
    TArgs
  >['args']
  recklesslySetUnpreparedOverrides?: WriteContractArgs<
    TAbi,
    TFunctionName,
    TArgs
  >['overrides']
}
export type UseContractWriteConfig<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
> = UseContractWriteArgs<TAbi, TFunctionName, TArgs> &
  MutationConfig<
    WriteContractResult,
    Error,
    UseContractWriteArgs<TAbi, TFunctionName, TArgs>
  >

function mutationKey<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
>({
  addressOrName,
  args,
  chainId,
  contractInterface,
  functionName,
  mode,
  overrides,
  request,
}: UseContractWriteArgs<TAbi, TFunctionName, TArgs>) {
  return [
    {
      entity: 'writeContract',
      addressOrName,
      args,
      chainId,
      contractInterface,
      functionName,
      mode,
      overrides,
      request,
    },
  ] as const
}

async function mutationFn<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
>(mutationKey: UseContractWriteArgs<TAbi, TFunctionName, TArgs>) {
  return writeContract<TAbi, TFunctionName, TArgs, TSigner>(
    <WriteContractArgs<TAbi, TFunctionName, TArgs>>mutationKey,
  )
}

/**
 * @description Hook for calling an ethers Contract [write](https://docs.ethers.io/v5/api/contract/contract/#Contract--write)
 * method.
 *
 * It is highly recommended to pair this with the [`usePrepareContractWrite` hook](/docs/prepare-hooks/usePrepareContractWrite)
 * to [avoid UX pitfalls](https://wagmi.sh/docs/prepare-hooks/intro#ux-pitfalls-without-prepare-hooks).
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
export function useContractWrite<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
>({
  addressOrName,
  args,
  chainId,
  contractInterface,
  functionName,
  mode,
  overrides,
  request,
  onError,
  onMutate,
  onSettled,
  onSuccess,
}: UseContractWriteConfig<TAbi, TFunctionName, TArgs>) {
  const {
    data,
    error,
    isError,
    isIdle,
    isLoading,
    isSuccess,
    mutate,
    mutateAsync,
    reset,
    status,
    variables,
  } = useMutation(
    mutationKey({
      addressOrName,
      args,
      chainId,
      contractInterface,
      functionName,
      mode,
      overrides,
      request,
    } as UseContractWriteArgs<TAbi, TFunctionName, TArgs>),
    mutationFn,
    {
      onError,
      onMutate,
      onSettled,
      onSuccess,
    },
  )

  const write = React.useCallback(
    (
      overrideConfig?: UseContractWriteMutationArgs<TAbi, TFunctionName, TArgs>,
    ) => {
      return mutate({
        addressOrName,
        args: overrideConfig?.recklesslySetUnpreparedArgs ?? args,
        chainId,
        contractInterface,
        functionName,
        mode: overrideConfig ? 'recklesslyUnprepared' : mode,
        overrides:
          overrideConfig?.recklesslySetUnpreparedOverrides ?? overrides,
        request,
      } as UseContractWriteArgs<TAbi, TFunctionName, TArgs>)
    },
    [
      addressOrName,
      args,
      chainId,
      contractInterface,
      functionName,
      mode,
      mutate,
      overrides,
      request,
    ],
  )

  const writeAsync = React.useCallback(
    (
      overrideConfig?: UseContractWriteMutationArgs<TAbi, TFunctionName, TArgs>,
    ) => {
      return mutateAsync({
        addressOrName,
        args: overrideConfig?.recklesslySetUnpreparedArgs ?? args,
        chainId,
        contractInterface,
        functionName,
        mode: overrideConfig ? 'recklesslyUnprepared' : mode,
        overrides:
          overrideConfig?.recklesslySetUnpreparedOverrides ?? overrides,
        request,
      } as UseContractWriteArgs<TAbi, TFunctionName, TArgs>)
    },
    [
      addressOrName,
      args,
      chainId,
      contractInterface,
      functionName,
      mode,
      mutateAsync,
      overrides,
      request,
    ],
  )

  return {
    data,
    error,
    isError,
    isIdle,
    isLoading,
    isSuccess,
    reset,
    status,
    variables,
    write: mode === 'prepared' && !request ? undefined : write,
    writeAsync: mode === 'prepared' && !request ? undefined : writeAsync,
  } as const
}
