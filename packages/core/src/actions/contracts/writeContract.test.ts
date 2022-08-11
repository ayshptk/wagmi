import { beforeEach, describe, expect, it } from 'vitest'

import { getSigners, setupClient, wagmiContractConfig } from '../../../test'
import { MockConnector } from '../../connectors/mock'
import { connect } from '../accounts'
import { prepareWriteContract } from './prepareWriteContract'
import { writeContract } from './writeContract'

const connector = new MockConnector({
  options: { signer: getSigners()[0]! },
})

describe('writeContract', () => {
  beforeEach(() => {
    setupClient()
  })

  it('prepared config', async () => {
    await connect({ connector })
    const config = await prepareWriteContract({
      ...wagmiContractConfig,
      functionName: 'mint',
    })
    const { hash } = await writeContract({ ...config })

    expect(hash).toBeDefined()
  })

  it('unprepared config', async () => {
    await connect({ connector })
    const { hash } = await writeContract({
      ...wagmiContractConfig,
      mode: 'recklesslyUnprepared',
      functionName: 'mint',
    })

    expect(hash).toBeDefined()
  })

  describe('errors', () => {
    it('signer is on different chain', async () => {
      await connect({ connector })
      const config = await prepareWriteContract({
        ...wagmiContractConfig,
        functionName: 'mint',
      })

      await expect(() =>
        writeContract({
          chainId: 69,
          ...config,
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"Chain mismatch: Expected \\"Chain 69\\", received \\"Ethereum\\"."`,
      )
    })

    it('contract method error', async () => {
      await connect({ connector })
      await expect(() =>
        writeContract({
          ...wagmiContractConfig,
          mode: 'recklesslyUnprepared',
          // @ts-expect-error contract function not in ABI
          functionName: 'claim',
        }),
      ).rejects.toThrowError()
    })

    it('connector not found', async () => {
      await expect(() =>
        writeContract({
          ...wagmiContractConfig,
          mode: 'recklesslyUnprepared',
          // @ts-expect-error contract function not in ABI
          functionName: 'claim',
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"Connector not found"`)
    })

    it('contract function not found', async () => {
      await connect({ connector })
      await expect(() =>
        writeContract({
          ...wagmiContractConfig,
          mode: 'recklesslyUnprepared',
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
        writeContract({
          mode: 'recklesslyUnprepared',
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
        writeContract({
          mode: 'recklesslyUnprepared',
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
        writeContract({
          mode: 'recklesslyUnprepared',
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
        writeContract({
          mode: 'recklesslyUnprepared',
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
        writeContract({
          mode: 'recklesslyUnprepared',
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
        writeContract({
          mode: 'recklesslyUnprepared',
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
