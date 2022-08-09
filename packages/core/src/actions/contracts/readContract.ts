import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import { CallOverrides, ContractInterface } from 'ethers/lib/ethers'
import { Result } from 'ethers/lib/utils'

import { getProvider } from '../providers'
import { GetContractArgs, getContract } from './getContract'

export type ReadContractConfig<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
> = {
  addressOrName: GetContractArgs['addressOrName']
  /** Chain id to use for provider */
  chainId?: number
  contractInterface: TAbi
  /** Function to invoke on the contract */
  functionName: TFunctionName
  /** Call overrides */
  overrides?: CallOverrides
} & (TArgs extends any[]
  ? {
      /** Arguments to pass contract method */
      args?: any
    }
  : TArgs['length'] extends 0
  ? { args?: never }
  : TArgs['length'] extends 1
  ? {
      /** Argument to pass contract method */
      args: TArgs[0]
    }
  : {
      /** Arguments to pass contract method */
      args: TArgs
    })

export type ReadContractResult<Data = Result> = Data

export async function readContract<
  TAbi extends Abi | [],
  TFunctionName extends TAbi extends Abi
    ? ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>
    : string,
  TArgs extends TAbi extends Abi
    ? AbiParametersToPrimitiveTypes<
        ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
      >
    : any,
>({
  addressOrName,
  args,
  chainId,
  contractInterface,
  functionName,
  overrides,
}: ReadContractConfig<
  TAbi,
  TFunctionName,
  TArgs
>): Promise<ReadContractResult> {
  const provider = getProvider({ chainId })
  const contract = getContract({
    addressOrName,
    contractInterface: <ContractInterface>(<unknown>contractInterface),
    signerOrProvider: provider,
  })

  const params = [
    ...(Array.isArray(args) ? args : args ? [args] : []),
    ...(overrides ? [overrides] : []),
  ]

  const contractFunction = contract[<string>functionName]
  if (!contractFunction)
    console.warn(
      `"${functionName}" is not in the interface for contract "${addressOrName}"`,
    )
  const response = await contractFunction?.(...params)
  return response
}
