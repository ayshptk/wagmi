import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import { CallOverrides, PopulatedTransaction } from 'ethers'

import { ChainMismatchError, ConnectorNotFoundError } from '../../errors'
import { Address, Signer } from '../../types'
import { fetchSigner, getNetwork } from '../accounts'
import { SendTransactionResult, sendTransaction } from '../transactions'
import {
  PrepareWriteContractConfig,
  prepareWriteContract,
} from './prepareWriteContract'

export type WriteContractPreparedArgs = {
  /**
   * `recklesslyUnprepared`: Allow to pass through unprepared config. Note: This has
   * [UX pitfalls](https://wagmi.sh/docs/prepare-hooks/intro#ux-pitfalls-without-prepare-hooks),
   * it is highly recommended to not use this and instead prepare the request upfront
   * using the {@link prepareWriteContract} function.
   *
   * `prepared`: The request has been prepared with parameters required for sending a transaction
   * via the {@link prepareWriteContract} function
   * */
  mode: 'prepared'
  /** The prepared request. */
  request: PopulatedTransaction & {
    to: Address
    gasLimit: NonNullable<PopulatedTransaction['gasLimit']>
  }
  args?: never
}
export type WriteContractUnpreparedArgs<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
> = {
  mode: 'recklesslyUnprepared'
  request?: never
} & (TArgs['length'] extends 0
  ? {
      // Add optional `args` param if not able to infer `TArgs`
      // e.g. not using const assertion for `contractInterface`
      // Otherwise remove from config object
      args?: [TArgs] extends [never] ? any | undefined : never
    }
  : {
      /** Arguments to pass contract method */
      args: TArgs['length'] extends 1 ? TArgs[0] : TArgs
    })

export type WriteContractArgs<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
> = {
  /** Contract address or ENS name */
  addressOrName: string
  /** Chain ID used to validate if the signer is connected to the target chain */
  chainId?: number
  /** Contract ABI */
  contractInterface: TAbi
  /** Method to call on contract */
  functionName: TFunctionName
  overrides?: CallOverrides
} & (
  | WriteContractUnpreparedArgs<TAbi, TFunctionName, TArgs>
  | WriteContractPreparedArgs
)

export type WriteContractResult = SendTransactionResult

/**
 * @description Function to call a contract write method.
 *
 * It is recommended to pair this with the {@link prepareWriteContract} function
 * to avoid [UX pitfalls](https://wagmi.sh/docs/prepare-hooks/intro#ux-pitfalls-without-prepare-hooks).
 *
 * @example
 * import { prepareWriteContract, writeContract } from '@wagmi/core'
 *
 * const config = await prepareWriteContract({
 *   addressOrName: '0x...',
 *   contractInterface: wagmiAbi,
 *   functionName: 'mint',
 * })
 * const result = await writeContract(config)
 */
export async function writeContract<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
>({
  addressOrName,
  args,
  chainId,
  contractInterface,
  functionName,
  mode,
  overrides,
  request: request_,
}: WriteContractArgs<
  TAbi,
  TFunctionName,
  TArgs
>): Promise<WriteContractResult> {
  /********************************************************************/
  /** START: iOS App Link cautious code.                              */
  /** Do not perform any async operations in this block.              */
  /** Ref: wagmi.sh/docs/prepare-hooks/intro#ios-app-link-constraints */
  /********************************************************************/

  const signer = await fetchSigner<TSigner>()
  if (!signer) throw new ConnectorNotFoundError()

  const { chain: activeChain, chains } = getNetwork()
  const activeChainId = activeChain?.id
  if (chainId && chainId !== activeChainId) {
    throw new ChainMismatchError({
      activeChain:
        chains.find((x) => x.id === activeChainId)?.name ??
        `Chain ${activeChainId}`,
      targetChain:
        chains.find((x) => x.id === chainId)?.name ?? `Chain ${chainId}`,
    })
  }

  if (mode === 'prepared') {
    if (!request_) throw new Error('`request` is required')
  }

  const request =
    mode === 'recklesslyUnprepared'
      ? (
          await prepareWriteContract(<
            PrepareWriteContractConfig<TAbi, TFunctionName, TArgs, TSigner>
          >{
            addressOrName,
            args,
            contractInterface,
            functionName,
            overrides,
          })
        ).request
      : request_

  const transaction = await sendTransaction({
    request,
    mode: 'prepared',
  })

  /********************************************************************/
  /** END: iOS App Link cautious code.                                */
  /** Go nuts!                                                        */
  /********************************************************************/

  return transaction
}
