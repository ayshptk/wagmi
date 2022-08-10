import { beforeEach, describe, expect, it } from 'vitest'

import { getSigners, setupClient, wagmiContractConfig } from '../../../test'
import { MockConnector } from '../../connectors/mock'
import { connect } from '../accounts'
import { prepareWriteContract } from './prepareWriteContract'

const connector = new MockConnector({
  options: { signer: getSigners()[0]! },
})

describe('prepareWriteContract', () => {
  beforeEach(() => {
    setupClient()
  })

  it('default', async () => {
    await connect({ connector })
    const { request } = await prepareWriteContract({
      ...wagmiContractConfig,
      functionName: 'mint',
    })

    const { data, gasLimit, ...rest } = request || {}
    expect(data).toBeDefined()
    expect(gasLimit).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "to": "0xaf0326d92b97dF1221759476B072abfd8084f9bE",
      }
    `)
  })

  describe('errors', () => {
    it('contract method error', async () => {
      await connect({ connector })
      await expect(() =>
        prepareWriteContract({
          ...wagmiContractConfig,
          // @ts-expect-error contract function not in ABI
          functionName: 'claim',
        }),
      ).rejects.toThrowError()
    })

    it('connector not found', async () => {
      await expect(() =>
        prepareWriteContract({
          ...wagmiContractConfig,
          functionName: 'mint',
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"Connector not found"`)
    })

    it('contract function not found', async () => {
      await connect({ connector })
      await expect(() =>
        prepareWriteContract({
          ...wagmiContractConfig,
          // @ts-expect-error contract function not in ABI
          functionName: 'wagmi',
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
              "Function \\"wagmi\\" on contract \\"0xaf0326d92b97df1221759476b072abfd8084f9be\\" does not exist.

              Etherscan: https://etherscan.io/address/0xaf0326d92b97df1221759476b072abfd8084f9be#readContract"
            `)
    })
  })

  describe('types', () => {
    describe('args', () => {
      it('zero', () => {
        prepareWriteContract({
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
          functionName: 'foo',
        })
      })

      it('one', () => {
        prepareWriteContract({
          addressOrName: '0x0000000000000000000000000000000000000000',
          contractInterface: [
            {
              type: 'function',
              name: 'foo',
              stateMutability: 'payable',
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
      })

      it('two or more', () => {
        prepareWriteContract({
          addressOrName: '0x0000000000000000000000000000000000000000',
          contractInterface: [
            {
              type: 'function',
              name: 'foo',
              stateMutability: 'payable',
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
      })

      it('wrong arg type', () => {
        prepareWriteContract({
          addressOrName: '0x0000000000000000000000000000000000000000',
          contractInterface: [
            {
              type: 'function',
              name: 'foo',
              stateMutability: 'payable',
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
      })
    })

    describe('behavior', () => {
      it('write function not allowed', () => {
        prepareWriteContract({
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
          // @ts-expect-error Trying to use non-write function
          functionName: 'foo',
        })
      })

      it('mutable abi', () => {
        prepareWriteContract({
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
          functionName: 'foo',
        })
      })
    })
  })
})
