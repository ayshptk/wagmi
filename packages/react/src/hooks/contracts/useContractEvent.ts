import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEventNames,
  ExtractAbiEventParameters,
} from 'abitype'
import { Contract, ContractInterface, ethers } from 'ethers'
import * as React from 'react'

import { useProvider, useWebSocketProvider } from '../providers'
import { useContract } from './useContract'

export type UseContractEventConfig<
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

export const useContractEvent = <
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiEventParameters<TAbi, TEventName>
  >,
>({
  addressOrName,
  chainId,
  contractInterface,
  listener,
  eventName,
  once,
}: UseContractEventConfig<TAbi, TEventName, TArgs>) => {
  const provider = useProvider({ chainId })
  const webSocketProvider = useWebSocketProvider({ chainId })
  const contract = useContract<Contract>({
    addressOrName,
    contractInterface: <ContractInterface>(<unknown>contractInterface),
    signerOrProvider: webSocketProvider ?? provider,
  })
  const listenerRef = React.useRef(listener)
  listenerRef.current = listener

  React.useEffect(() => {
    type Listener = (...args: any[]) => void
    const handler = <Listener>(<unknown>listenerRef.current)

    const contract_ = <ethers.Contract>(<unknown>contract)
    if (once) contract_.once(eventName, handler)
    else contract_.on(eventName, handler)

    return () => {
      contract_.off(eventName, handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, eventName])
}
