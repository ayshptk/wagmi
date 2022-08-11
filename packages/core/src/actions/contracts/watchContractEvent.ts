import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEventNames,
  ExtractAbiEventParameters,
} from 'abitype'
import { Contract, ContractInterface } from 'ethers'
import shallow from 'zustand/shallow'

import { getClient } from '../../client'
import { getProvider, getWebSocketProvider } from '../providers'
import { getContract } from './getContract'

export type WatchContractEventConfig<
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiEventParameters<TAbi, TEventName>
  >,
> = {
  /** Contract address or ENS name */
  addressOrName: string
  /** Chain id to use for provider */
  chainId?: number
  /** Contract ABI */
  contractInterface: TAbi
  /** Event name to listen to */
  eventName: TEventName
  /** Callback function when event is called */
  listener: (
    ...args: [TArgs] extends [never]
      ? any[]
      : TArgs extends readonly any[]
      ? TArgs
      : never
  ) => void
  /** Receive only a single event */
  once?: boolean
}

export function watchContractEvent<
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiEventParameters<TAbi, TEventName>
  >,
>({
  addressOrName,
  contractInterface,
  eventName,
  chainId,
  listener,
  once,
}: WatchContractEventConfig<TAbi, TEventName, TArgs>) {
  let contract: Contract
  const watchEvent = async () => {
    if (contract) {
      contract?.off(eventName, <any>listener)
    }

    contract = getContract({
      addressOrName,
      contractInterface: <ContractInterface>(<unknown>contractInterface),
      signerOrProvider:
        getWebSocketProvider({ chainId }) || getProvider({ chainId }),
    })

    if (once) contract.once(eventName, <any>listener)
    else contract.on(eventName, <any>listener)
  }

  watchEvent()
  const client = getClient()
  const unsubscribe = client.subscribe(
    ({ provider, webSocketProvider }) => ({
      provider,
      webSocketProvider,
    }),
    watchEvent,
    { equalityFn: shallow },
  )

  return () => {
    contract?.off(eventName, <any>listener)
    unsubscribe()
  }
}
