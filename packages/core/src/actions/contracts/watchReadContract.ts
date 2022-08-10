import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'

import { getClient } from '../../client'
import { watchBlockNumber } from '../network-status/watchBlockNumber'
import {
  ReadContractConfig,
  ReadContractResult,
  readContract,
} from './readContract'

export type WatchReadContractConfig<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
> = ReadContractConfig<TAbi, TFunctionName, TArgs> & {
  listenToBlock?: boolean
}
export type WatchReadContractResult<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TResponse extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'outputs'>
  >,
> = (result: ReadContractResult<TAbi, TFunctionName, TResponse>) => void

export function watchReadContract<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TResponse extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'outputs'>
  >,
>(
  config: WatchReadContractConfig<TAbi, TFunctionName, TArgs>,
  callback: WatchReadContractResult<TAbi, TFunctionName, TResponse>,
) {
  const client = getClient()

  const handleChange = async () => callback(await readContract(config))

  const unwatch = config.listenToBlock
    ? watchBlockNumber({ listen: true }, handleChange)
    : undefined
  const unsubscribe = client.subscribe(({ provider }) => provider, handleChange)

  return () => {
    unsubscribe()
    unwatch?.()
  }
}
