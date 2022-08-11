import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import {
  CallOverrides,
  ContractInterface,
  PopulatedTransaction,
} from 'ethers/lib/ethers'

import {
  ConnectorNotFoundError,
  ContractMethodDoesNotExistError,
} from '../../errors'
import { Address, Signer } from '../../types'
import { fetchSigner } from '../accounts'
import { getContract } from './getContract'

export type PrepareWriteContractConfig<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
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
  signer?: TSigner | null
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

export type PrepareWriteContractResult<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
> = Omit<
  PrepareWriteContractConfig<TAbi, TFunctionName, TArgs, TSigner>,
  'args'
> & {
  mode: 'prepared'
  request: PopulatedTransaction & {
    to: Address
    gasLimit: NonNullable<PopulatedTransaction['gasLimit']>
  }
}

/**
 * @description Prepares the parameters required for a contract write transaction.
 *
 * Returns config to be passed through to `writeContract`.
 *
 * @example
 * import { prepareWriteContract, writeContract } from '@wagmi/core'
 *
 * const config = await prepareWriteContract({
 *  addressOrName: '0x...',
 *  contractInterface: wagmiAbi,
 *  functionName: 'mint',
 * })
 * const result = await writeContract(config)
 */
export async function prepareWriteContract<
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
  overrides,
  signer: signer_,
}: PrepareWriteContractConfig<TAbi, TFunctionName, TArgs, TSigner>): Promise<
  PrepareWriteContractResult<TAbi, TFunctionName, TArgs, TSigner>
> {
  const signer = signer_ ?? (await fetchSigner())
  if (!signer) throw new ConnectorNotFoundError()

  const contract = getContract({
    addressOrName,
    contractInterface: <ContractInterface>(<unknown>contractInterface),
    signerOrProvider: signer,
  })

  const populateTransactionFn = contract.populateTransaction[functionName]
  if (!populateTransactionFn) {
    throw new ContractMethodDoesNotExistError({
      addressOrName,
      functionName,
    })
  }

  const params = [
    ...(Array.isArray(args) ? args : args ? [args] : []),
    ...(overrides ? [overrides] : []),
  ]
  const unsignedTransaction = (await populateTransactionFn(
    ...params,
  )) as PopulatedTransaction & {
    to: Address
  }
  const gasLimit =
    unsignedTransaction.gasLimit ||
    (await signer.estimateGas(unsignedTransaction))

  return {
    addressOrName,
    chainId,
    contractInterface,
    functionName,
    mode: 'prepared',
    overrides,
    request: {
      ...unsignedTransaction,
      gasLimit,
    },
  } as PrepareWriteContractResult<TAbi, TFunctionName, TArgs, TSigner>
}
