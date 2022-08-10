import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import { CallOverrides, ContractInterface } from 'ethers/lib/ethers'

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
} & (TArgs['length'] extends 0
  ? {
      // Add optional `args` param if not able to infer `TArgs`
      // e.g. not using const assertion for `contractInterface`
      args?: [TArgs] extends [never] ? any : never
    }
  : {
      /** Arguments to pass contract method */
      args: TArgs['length'] extends 1 ? TArgs[0] : TArgs
    })

export type ReadContractResult<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TResponse extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'outputs'>
  >,
> = TResponse['length'] extends 0
  ? void
  : TResponse['length'] extends 1
  ? TResponse[0]
  : TResponse

export async function readContract<
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
  args,
  chainId,
  contractInterface,
  functionName,
  overrides,
}: ReadContractConfig<TAbi, TFunctionName, TArgs>): Promise<
  ReadContractResult<TAbi, TFunctionName, TResponse>
> {
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

  const contractFunction = contract[functionName]
  if (!contractFunction)
    console.warn(
      `"${functionName}" is not in the interface for contract "${addressOrName}"`,
    )
  return (await contractFunction?.(...params)) as TResponse
}
