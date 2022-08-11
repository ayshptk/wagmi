import { describe, expect, it } from 'vitest'

import {
  act,
  doNotExecute,
  expectType,
  mlootContractConfig,
  renderHook,
  wagmigotchiContractConfig,
} from '../../../test'
import { useContractRead } from './useContractRead'

describe('useContractRead', () => {
  it('mounts', async () => {
    const { result, waitFor } = renderHook(() =>
      useContractRead({
        ...wagmigotchiContractConfig,
        functionName: 'love',
        args: '0x27a69ffba1e939ddcfecc8c7e0f967b872bac65c',
      }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { internal, ...res } = result.current
    expect(res).toMatchInlineSnapshot(`
      {
        "data": {
          "hex": "0x02",
          "type": "BigNumber",
        },
        "error": null,
        "fetchStatus": "idle",
        "isError": false,
        "isFetched": true,
        "isFetching": false,
        "isIdle": false,
        "isLoading": false,
        "isRefetching": false,
        "isSuccess": true,
        "refetch": [Function],
        "status": "success",
      }
    `)
  })

  describe('configuration', () => {
    it('chainId', async () => {
      const { result, waitFor } = renderHook(() =>
        useContractRead({
          ...wagmigotchiContractConfig,
          functionName: 'love',
          args: '0x27a69ffba1e939ddcfecc8c7e0f967b872bac65c',
          chainId: 1,
        }),
      )

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { internal, ...res } = result.current
      expect(res).toMatchInlineSnapshot(`
        {
          "data": {
            "hex": "0x02",
            "type": "BigNumber",
          },
          "error": null,
          "fetchStatus": "idle",
          "isError": false,
          "isFetched": true,
          "isFetching": false,
          "isIdle": false,
          "isLoading": false,
          "isRefetching": false,
          "isSuccess": true,
          "refetch": [Function],
          "status": "success",
        }
      `)
    })

    it('enabled', async () => {
      const { result, waitFor } = renderHook(() =>
        useContractRead({
          ...wagmigotchiContractConfig,
          functionName: 'love',
          args: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
          enabled: false,
        }),
      )

      await waitFor(() => expect(result.current.isIdle).toBeTruthy())

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { internal, ...res } = result.current
      expect(res).toMatchInlineSnapshot(`
        {
          "data": undefined,
          "error": null,
          "fetchStatus": "idle",
          "isError": false,
          "isFetched": false,
          "isFetching": false,
          "isIdle": true,
          "isLoading": false,
          "isRefetching": false,
          "isSuccess": false,
          "refetch": [Function],
          "status": "idle",
        }
      `)
    })
  })

  describe('return value', () => {
    it('refetch', async () => {
      const { result } = renderHook(() =>
        useContractRead({
          ...wagmigotchiContractConfig,
          functionName: 'love',
          args: '0x27a69ffba1e939ddcfecc8c7e0f967b872bac65c',
          enabled: false,
        }),
      )

      await act(async () => {
        const { data } = await result.current.refetch()
        expect(data).toMatchInlineSnapshot(`
          {
            "hex": "0x02",
            "type": "BigNumber",
          }
        `)
      })
    })
  })

  describe('behavior', () => {
    it('can use multiple args', async () => {
      const { result, waitFor } = renderHook(() =>
        useContractRead({
          ...mlootContractConfig,
          functionName: 'tokenOfOwnerByIndex',
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', 0],
        }),
      )

      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { internal, ...res } = result.current
      expect(res).toMatchInlineSnapshot(`
        {
          "data": {
            "hex": "0x05a6db",
            "type": "BigNumber",
          },
          "error": null,
          "fetchStatus": "idle",
          "isError": false,
          "isFetched": true,
          "isFetching": false,
          "isIdle": false,
          "isLoading": false,
          "isRefetching": false,
          "isSuccess": true,
          "refetch": [Function],
          "status": "success",
        }
      `)
    })
  })

  describe('types', () => {
    describe('args', () => {
      it('zero', () => {
        doNotExecute(() => {
          const { data } = useContractRead({
            addressOrName: '0x0000000000000000000000000000000000000000',
            contractInterface: [
              {
                type: 'function',
                name: 'foo',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ name: '', type: 'string' }],
              },
            ] as const,
            functionName: 'foo',
          })
          expectType<string | undefined>(data)
        })

        it('one', () => {
          doNotExecute(() => {
            const { data } = useContractRead({
              addressOrName: '0x0000000000000000000000000000000000000000',
              contractInterface: [
                {
                  type: 'function',
                  name: 'foo',
                  stateMutability: 'view',
                  inputs: [
                    {
                      name: '',
                      type: 'tuple',
                      components: [{ name: 'bar', type: 'string' }],
                    },
                  ],
                  outputs: [
                    {
                      name: '',
                      type: 'tuple',
                      components: [{ name: 'bar', type: 'string' }],
                    },
                  ],
                },
              ] as const,
              functionName: 'foo',
              args: {
                bar: 'hello',
              },
            })
            expectType<{ bar: string } | undefined>(data)
          })
        })

        it('two or more', () => {
          doNotExecute(() => {
            const { data } = useContractRead({
              addressOrName: '0x0000000000000000000000000000000000000000',
              contractInterface: [
                {
                  type: 'function',
                  name: 'foo',
                  stateMutability: 'view',
                  inputs: [
                    {
                      name: 'address',
                      type: 'address',
                    },
                    {
                      name: 'tokenIds',
                      type: 'int[3]',
                    },
                  ],
                  outputs: [{ name: '', type: 'int' }],
                },
              ] as const,
              functionName: 'foo',
              args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', [1, 2, 3]],
            })
            expectType<number | bigint | undefined>(data)
          })
        })

        it('wrong arg type', () => {
          doNotExecute(() => {
            const { data } = useContractRead({
              addressOrName: '0x0000000000000000000000000000000000000000',
              contractInterface: [
                {
                  type: 'function',
                  name: 'foo',
                  stateMutability: 'view',
                  inputs: [
                    {
                      name: 'owner',
                      type: 'address',
                    },
                  ],
                  outputs: [{ name: '', type: 'string' }],
                },
              ] as const,
              functionName: 'foo',
              // @ts-expect-error arg not in address format
              args: 'notanaddress',
            })
            expectType<string | undefined>(data)
          })
        })
      })
    })

    describe('behavior', () => {
      it('write function not allowed', () => {
        doNotExecute(() => {
          const { data } = useContractRead({
            addressOrName: '0x0000000000000000000000000000000000000000',
            contractInterface: [
              {
                type: 'function',
                name: 'foo',
                stateMutability: 'payable',
                inputs: [],
                outputs: [{ name: '', type: 'string' }],
              },
            ],
            // @ts-expect-error Trying to use non-read function
            functionName: 'foo',
          })
          expectType<any>(data)
        })
      })

      it('mutable abi', () => {
        doNotExecute(() => {
          const { data } = useContractRead({
            addressOrName: '0x0000000000000000000000000000000000000000',
            contractInterface: [
              {
                type: 'function',
                name: 'foo',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ name: '', type: 'string' }],
              },
            ],
            functionName: 'foo',
          })
          expectType<any>(data)
        })
      })
    })
  })
})
