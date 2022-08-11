import { Signer } from '@wagmi/core'
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import { describe, expect, it } from 'vitest'

import {
  act,
  actConnect,
  doNotExecute,
  getCrowdfundArgs,
  getSigners,
  getTotalSupply,
  mirrorCrowdfundContractConfig,
  mlootContractConfig,
  renderHook,
  wagmiContractConfig,
} from '../../../test'
import { useConnect } from '../accounts'
import { UseContractWriteConfig, useContractWrite } from './useContractWrite'
import {
  UsePrepareContractWriteConfig,
  usePrepareContractWrite,
} from './usePrepareContractWrite'

function useContractWriteWithConnect<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
>(config: UseContractWriteConfig<TAbi, TFunctionName, TArgs>) {
  return {
    connect: useConnect(),
    contractWrite: useContractWrite(config),
  }
}

function usePrepareContractWriteWithConnect<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
>(config: {
  chainId?: number
  prepare: UsePrepareContractWriteConfig<TAbi, TFunctionName, TArgs, TSigner>
}) {
  const prepareContractWrite = usePrepareContractWrite(config.prepare)
  return {
    connect: useConnect(),
    prepareContractWrite,
    contractWrite: useContractWrite({
      chainId: config?.chainId,
      ...prepareContractWrite.config,
    }),
  }
}

describe('useContractWrite', () => {
  describe('mounts', () => {
    it('prepared', async () => {
      const { result } = renderHook(() =>
        useContractWrite({
          mode: 'prepared',
          ...wagmiContractConfig,
          functionName: 'mint',
          request: undefined,
        }),
      )

      expect(result.current).toMatchInlineSnapshot(`
        {
          "data": undefined,
          "error": null,
          "isError": false,
          "isIdle": true,
          "isLoading": false,
          "isSuccess": false,
          "reset": [Function],
          "status": "idle",
          "variables": undefined,
          "write": undefined,
          "writeAsync": undefined,
        }
      `)
    })

    it('recklesslyUnprepared', async () => {
      const { result } = renderHook(() =>
        useContractWrite({
          mode: 'recklesslyUnprepared',
          ...wagmiContractConfig,
          functionName: 'mint',
        }),
      )

      expect(result.current).toMatchInlineSnapshot(`
        {
          "data": undefined,
          "error": null,
          "isError": false,
          "isIdle": true,
          "isLoading": false,
          "isSuccess": false,
          "reset": [Function],
          "status": "idle",
          "variables": undefined,
          "write": [Function],
          "writeAsync": [Function],
        }
      `)
    })
  })

  describe('configuration', () => {
    describe('chainId', () => {
      it('unable to switch', async () => {
        const utils = renderHook(() =>
          usePrepareContractWriteWithConnect({
            prepare: {
              ...wagmiContractConfig,
              functionName: 'mint',
            },
            chainId: 69,
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.write).toBeDefined(),
        )

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isError).toBeTruthy(),
        )

        expect(result.current.contractWrite.error).toMatchInlineSnapshot(
          `[ChainMismatchError: Chain mismatch: Expected "Chain 69", received "Ethereum".]`,
        )
      })
    })
  })

  describe('return value', () => {
    describe('write', () => {
      it('prepared', async () => {
        const utils = renderHook(() =>
          usePrepareContractWriteWithConnect({
            prepare: {
              ...wagmiContractConfig,
              functionName: 'mint',
            },
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.write).toBeDefined(),
        )

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
          {
            "error": null,
            "isError": false,
            "isIdle": false,
            "isLoading": false,
            "isSuccess": true,
            "reset": [Function],
            "status": "success",
            "write": [Function],
            "writeAsync": [Function],
          }
        `)
      })

      it('prepared with deferred args', async () => {
        const data = getCrowdfundArgs()
        const utils = renderHook(() =>
          usePrepareContractWriteWithConnect({
            prepare: {
              ...mirrorCrowdfundContractConfig,
              functionName: 'createCrowdfund',
              args: data,
            },
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(
          () => expect(result.current.contractWrite.write).toBeDefined(),
          { timeout: 10_000 },
        )

        await act(async () => {
          result.current.contractWrite.write?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          })
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      }, 10_000)

      it('recklesslyUnprepared', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...wagmiContractConfig,
            functionName: 'mint',
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
          {
            "error": null,
            "isError": false,
            "isIdle": false,
            "isLoading": false,
            "isSuccess": true,
            "reset": [Function],
            "status": "success",
            "write": [Function],
            "writeAsync": [Function],
          }
        `)
      })

      it('recklesslyUnprepared with deferred args', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mirrorCrowdfundContractConfig,
            functionName: 'createCrowdfund',
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () =>
          result.current.contractWrite.write?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          }),
        )
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      })

      it('throws error', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mlootContractConfig,
            functionName: 'claim',
            args: 1,
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isError).toBeTruthy(),
        )

        const { variables, ...res } = result.current.contractWrite
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
          {
            "data": undefined,
            "error": [Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\\"jsonrpc\\":\\"2.0\\",\\"id\\":42,\\"error\\":{\\"code\\":3,\\"message\\":\\"execution reverted: Token ID invalid\\",\\"data\\":\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\"}}","error":{"code":3,"data":"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000"},"requestBody":"{\\"method\\":\\"eth_estimateGas\\",\\"params\\":[{\\"from\\":\\"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266\\",\\"to\\":\\"0x1dfe7ca09e99d10835bf73044a23b73fc20623df\\",\\"data\\":\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\"}],\\"id\\":42,\\"jsonrpc\\":\\"2.0\\"}","requestMethod":"POST","url":"http://127.0.0.1:8545"}, method="estimateGas", transaction={"from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF","data":"0x379607f50000000000000000000000000000000000000000000000000000000000000001","accessList":null}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.6.5)],
            "isError": true,
            "isIdle": false,
            "isLoading": false,
            "isSuccess": false,
            "reset": [Function],
            "status": "error",
            "write": [Function],
            "writeAsync": [Function],
          }
        `)
      })
    })

    describe('writeAsync', () => {
      it('prepared', async () => {
        const utils = renderHook(() =>
          usePrepareContractWriteWithConnect({
            prepare: {
              ...wagmiContractConfig,
              functionName: 'mint',
            },
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.writeAsync).toBeDefined(),
        )

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.()
          expect(res?.hash).toBeDefined()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
            {
              "error": null,
              "isError": false,
              "isIdle": false,
              "isLoading": false,
              "isSuccess": true,
              "reset": [Function],
              "status": "success",
              "write": [Function],
              "writeAsync": [Function],
            }
          `)
      })

      it('prepared with deferred args', async () => {
        const data = getCrowdfundArgs()
        const utils = renderHook(() =>
          usePrepareContractWriteWithConnect({
            prepare: {
              ...mirrorCrowdfundContractConfig,
              functionName: 'createCrowdfund',
              args: data,
            },
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.writeAsync).toBeDefined(),
        )

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          })
          expect(res?.hash).toBeDefined()
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      })

      it('recklesslyUnprepared', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...wagmiContractConfig,
            functionName: 'mint',
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.()
          expect(res?.hash).toBeDefined()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
            {
              "error": null,
              "isError": false,
              "isIdle": false,
              "isLoading": false,
              "isSuccess": true,
              "reset": [Function],
              "status": "success",
              "write": [Function],
              "writeAsync": [Function],
            }
          `)
      })

      it('recklesslyUnprepared with deferred args', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mirrorCrowdfundContractConfig,
            functionName: 'createCrowdfund',
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          })
          expect(res?.hash).toBeDefined()
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      })

      it('throws error', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mlootContractConfig,
            functionName: 'claim',
            args: 1,
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          await expect(
            result.current.contractWrite.writeAsync?.({
              recklesslySetUnpreparedArgs: 1,
            }),
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (error={\\"reason\\":\\"processing response error\\",\\"code\\":\\"SERVER_ERROR\\",\\"body\\":\\"{\\\\\\"jsonrpc\\\\\\":\\\\\\"2.0\\\\\\",\\\\\\"id\\\\\\":42,\\\\\\"error\\\\\\":{\\\\\\"code\\\\\\":3,\\\\\\"message\\\\\\":\\\\\\"execution reverted: Token ID invalid\\\\\\",\\\\\\"data\\\\\\":\\\\\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\\\\\"}}\\",\\"error\\":{\\"code\\":3,\\"data\\":\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\"},\\"requestBody\\":\\"{\\\\\\"method\\\\\\":\\\\\\"eth_estimateGas\\\\\\",\\\\\\"params\\\\\\":[{\\\\\\"from\\\\\\":\\\\\\"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266\\\\\\",\\\\\\"to\\\\\\":\\\\\\"0x1dfe7ca09e99d10835bf73044a23b73fc20623df\\\\\\",\\\\\\"data\\\\\\":\\\\\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\\\\\"}],\\\\\\"id\\\\\\":42,\\\\\\"jsonrpc\\\\\\":\\\\\\"2.0\\\\\\"}\\",\\"requestMethod\\":\\"POST\\",\\"url\\":\\"http://127.0.0.1:8545\\"}, method=\\"estimateGas\\", transaction={\\"from\\":\\"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\\",\\"to\\":\\"0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF\\",\\"data\\":\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\",\\"accessList\\":null}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.6.5)"`,
          )
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isError).toBeTruthy(),
        )
      })
    })
  })

  describe('behavior', () => {
    it('multiple writes', async () => {
      let args: any[] | any = []
      let functionName: 'mint' | 'transferFrom' = 'mint'
      const utils = renderHook(() =>
        usePrepareContractWriteWithConnect({
          prepare: {
            ...wagmiContractConfig,
            functionName,
            args,
          },
        }),
      )
      const { result, rerender, waitFor } = utils
      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.contractWrite.write).toBeDefined(),
      )
      await act(async () => result.current.contractWrite.write?.())
      await waitFor(() =>
        expect(result.current.contractWrite.isSuccess).toBeTruthy(),
      )

      expect(result.current.contractWrite.data?.hash).toBeDefined()

      const from = await getSigners()[0]?.getAddress()
      const to = await getSigners()[1]?.getAddress()
      const tokenId = await getTotalSupply(wagmiContractConfig.addressOrName)
      functionName = 'transferFrom'
      args = [from, to, tokenId]
      rerender()

      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.contractWrite.write).toBeDefined(),
      )
      await act(async () => result.current.contractWrite.write?.())
      await waitFor(() =>
        expect(result.current.contractWrite.isSuccess).toBeTruthy(),
      )

      expect(result.current.contractWrite.data?.hash).toBeDefined()
    })
  })

  describe('types', () => {
    describe('args', () => {
      it('zero', () => {
        doNotExecute(() =>
          useContractWrite({
            mode: 'recklesslyUnprepared',
            ...wagmiContractConfig,
            functionName: 'mint',
          }),
        )
      })

      it('one', () => {
        doNotExecute(() =>
          useContractWrite({
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
          }),
        )
      })

      it('two or more', () => {
        doNotExecute(() =>
          useContractWrite({
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
          }),
        )
      })
    })

    describe('behavior', () => {
      it('write function not allowed', () => {
        doNotExecute(() =>
          useContractWrite({
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
            ],
            // @ts-expect-error Trying to use non-read function
            functionName: 'foo',
          }),
        )
      })

      it('mutable abi', () => {
        doNotExecute(() =>
          useContractWrite({
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
          }),
        )
      })
    })
  })
})
