import { beforeEach, describe, expect, it } from 'vitest'

import {
  expectType,
  mlootContractConfig,
  setupClient,
  wagmigotchiContractConfig,
} from '../../../test'
import { readContract } from './readContract'

describe('readContract', () => {
  describe('args', () => {
    beforeEach(() => {
      setupClient()
    })

    it('chainId', async () => {
      const res = await readContract({
        ...wagmigotchiContractConfig,
        functionName: 'love',
        args: '0x27a69ffba1e939ddcfecc8c7e0f967b872bac65c',
        chainId: 1,
      })
      expectType<number | bigint>(res)
      expect(res).toMatchInlineSnapshot(`
        {
          "hex": "0x02",
          "type": "BigNumber",
        }
      `)
    })

    it('contract args', async () => {
      const res = await readContract({
        ...wagmigotchiContractConfig,
        functionName: 'love',
        args: '0x27a69ffba1e939ddcfecc8c7e0f967b872bac65c',
      })
      expectType<number | bigint>(res)
      expect(res).toMatchInlineSnapshot(`
        {
          "hex": "0x02",
          "type": "BigNumber",
        }
      `)
    })

    it('overrides', async () => {
      const res = await readContract({
        ...wagmigotchiContractConfig,
        functionName: 'love',
        args: '0x27a69ffba1e939ddcfecc8c7e0f967b872bac65c',
        overrides: {},
      })
      expectType<number | bigint>(res)
      expect(res).toMatchInlineSnapshot(`
        {
          "hex": "0x02",
          "type": "BigNumber",
        }
      `)
    })
  })

  describe('behavior', () => {
    it('can use multiple args', async () => {
      const res = await readContract({
        ...mlootContractConfig,
        functionName: 'tokenOfOwnerByIndex',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', 0],
      })
      expectType<number | bigint>(res)
      expect(res).toMatchInlineSnapshot(`
        {
          "hex": "0x05a6db",
          "type": "BigNumber",
        }
      `)
    })
  })

  describe('types', () => {
    describe('args', () => {
      it('zero', () => {
        const res = readContract({
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
        expectType<Promise<string>>(res)
      })

      it('one', () => {
        const res = readContract({
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
        expectType<Promise<{ bar: string }>>(res)
      })

      it('two or more', () => {
        const res = readContract({
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
        expectType<Promise<number | bigint>>(res)
      })

      it('wrong arg type', () => {
        const res = readContract({
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
        expectType<Promise<string>>(res)
      })
    })

    describe('behavior', () => {
      it('write function not allowed', () => {
        const res = readContract({
          addressOrName: '0x0000000000000000000000000000000000000000',
          contractInterface: [
            {
              type: 'function',
              name: 'foo',
              stateMutability: 'payable',
              inputs: [],
              outputs: [{ name: '', type: 'string' }],
            },
          ] as const,
          // @ts-expect-error Trying to use non-read function
          functionName: 'foo',
        })
        expectType<Promise<any>>(res)
      })

      it('mutable abi', () => {
        const res = readContract({
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
        expectType<Promise<any>>(res)
      })
    })
  })
})
