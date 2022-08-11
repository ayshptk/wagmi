import { erc20ABI } from '@wagmi/core'
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  Address,
  ExtractAbiEventNames,
  ExtractAbiEventParameters,
} from 'abitype'
import { describe, expect, it, vi } from 'vitest'

import {
  act,
  actConnect,
  expectType,
  renderHook,
  wagmiContractConfig,
} from '../../../test'
import { useConnect } from '../accounts'
import {
  UseWaitForTransactionArgs,
  UseWaitForTransactionConfig,
  useWaitForTransaction,
} from '../transactions/useWaitForTransaction'
import { UseContractEventConfig, useContractEvent } from './useContractEvent'
import {
  UseContractWriteArgs,
  UseContractWriteConfig,
  useContractWrite,
} from './useContractWrite'

const uniContractAddress = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'

function useContractEventWithWrite<
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiEventParameters<TAbi, TEventName>
  >,
>(config: {
  contractEvent: {
    config: UseContractEventConfig<TAbi, TEventName, TArgs>
  }
  contractWrite: {
    config: UseContractWriteArgs & UseContractWriteConfig
  }
  waitForTransaction?: UseWaitForTransactionArgs & UseWaitForTransactionConfig
}) {
  return {
    connect: useConnect(),
    contractEvent: useContractEvent(config.contractEvent.config),
    contractWrite: useContractWrite(config.contractWrite.config),
    waitForTransaction: useWaitForTransaction(config.waitForTransaction),
  }
}

describe('useContractEvent', () => {
  it('mounts', () => {
    const listener = vi.fn()
    renderHook(() =>
      useContractEvent({
        addressOrName: uniContractAddress,
        contractInterface: erc20ABI,
        eventName: 'Transfer',
        listener,
      }),
    )
    expect(listener).toHaveBeenCalledTimes(0)
  })

  describe('configuration', () => {
    describe('once', () => {
      it('listens', async () => {
        let hash: string | undefined = undefined

        const listener = vi.fn()
        const utils = renderHook(() =>
          useContractEventWithWrite({
            contractEvent: {
              config: {
                ...wagmiContractConfig,
                eventName: 'Transfer',
                listener,
              },
            },
            contractWrite: {
              config: {
                mode: 'recklesslyUnprepared',
                ...wagmiContractConfig,
                functionName: 'mint',
              },
            },
            waitForTransaction: { hash },
          }),
        )
        const { result, rerender, waitFor } = utils
        await actConnect({ utils })

        await act(async () => result.current.contractWrite.write?.())
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )
        hash = result.current.contractWrite.data?.hash
        rerender()
        await waitFor(() =>
          expect(result.current.waitForTransaction.isSuccess).toBeTruthy(),
        )

        expect(listener).toHaveBeenCalled()
      })
    })
  })

  describe('types', () => {
    describe('args', () => {
      it('one', () => {
        renderHook(() =>
          useContractEvent({
            addressOrName: uniContractAddress,
            contractInterface: [
              {
                type: 'event',
                name: 'Foo',
                stateMutability: 'view',
                inputs: [
                  {
                    name: '',
                    type: 'tuple',
                    components: [{ name: 'bar', type: 'address' }],
                  },
                ],
              },
            ] as const,
            eventName: 'Foo',
            listener(from) {
              expectType<{ bar: Address }>(from)
            },
            once: true,
          }),
        )
      })

      it('two or more', () => {
        renderHook(() =>
          useContractEvent({
            addressOrName: uniContractAddress,
            contractInterface: erc20ABI,
            eventName: 'Transfer',
            listener(from, to, tokenId) {
              expectType<string>(from)
              expectType<string>(to)
              expectType<number | bigint>(tokenId)
            },
            once: true,
          }),
        )
      })
    })

    describe('behavior', () => {
      it('invalid event name', () => {
        renderHook(() =>
          useContractEvent({
            addressOrName: uniContractAddress,
            contractInterface: [
              {
                type: 'event',
                name: 'Foo',
                stateMutability: 'view',
                inputs: [{ name: '', type: 'string' }],
              },
            ] as const,
            // @ts-expect-error Invalid event name
            eventName: 'foo',
            listener(from) {
              expectType<string>(from)
            },
            once: true,
          }),
        )
      })

      it('mutable abi', () => {
        renderHook(() =>
          useContractEvent({
            addressOrName: uniContractAddress,
            contractInterface: [
              {
                type: 'event',
                name: 'Foo',
                stateMutability: 'view',
                inputs: [{ name: '', type: 'string' }],
              },
            ],
            eventName: 'foo',
            listener(from) {
              expectType<string>(from)
            },
            once: true,
          }),
        )
      })
    })
  })
})
