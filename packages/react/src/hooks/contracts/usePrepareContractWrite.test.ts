import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunctionNames,
  ExtractAbiFunctionParameters,
} from 'abitype'
import { Signer } from 'ethers'
import { describe, expect, it } from 'vitest'

import {
  actConnect,
  mlootContractConfig,
  renderHook,
  wagmiContractConfig,
} from '../../../test'
import { useConnect } from '../accounts'
import {
  UsePrepareContractWriteConfig,
  usePrepareContractWrite,
} from './usePrepareContractWrite'

function usePrepareContractWriteWithConnect<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'payable' | 'nonpayable'>,
  TArgs extends AbiParametersToPrimitiveTypes<
    ExtractAbiFunctionParameters<TAbi, TFunctionName, 'inputs'>
  >,
  TSigner extends Signer = Signer,
>(config: UsePrepareContractWriteConfig<TAbi, TFunctionName, TArgs, TSigner>) {
  const { ...prepareContractTransaction } = usePrepareContractWrite(config)
  return {
    connect: useConnect(),
    prepareContractTransaction,
  }
}

describe('usePrepareContractWrite', () => {
  it('mounts', async () => {
    const { result } = renderHook(() =>
      usePrepareContractWriteWithConnect({
        ...wagmiContractConfig,
        functionName: 'mint',
      }),
    )

    const { config, ...rest } = result.current.prepareContractTransaction
    expect(config).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "data": undefined,
        "error": null,
        "fetchStatus": "idle",
        "internal": {
          "dataUpdatedAt": 0,
          "errorUpdatedAt": 0,
          "failureCount": 0,
          "isFetchedAfterMount": false,
          "isLoadingError": false,
          "isPaused": false,
          "isPlaceholderData": false,
          "isPreviousData": false,
          "isRefetchError": false,
          "isStale": true,
          "remove": [Function],
        },
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

  it('connect', async () => {
    const utils = renderHook(() =>
      usePrepareContractWriteWithConnect({
        ...wagmiContractConfig,
        functionName: 'mint',
      }),
    )
    const { result, waitFor } = utils

    await actConnect({ utils })

    await waitFor(() =>
      expect(result.current.prepareContractTransaction.isSuccess).toBeTruthy(),
    )

    const {
      config,
      data: res,
      ...rest
    } = result.current.prepareContractTransaction
    const { data, gasLimit, ...restRequest } = config?.request || {}
    expect(res).toBeDefined()
    expect(config).toBeDefined()
    expect(gasLimit).toBeDefined()
    expect(data).toBeDefined()
    expect(restRequest).toMatchInlineSnapshot(`
      {
        "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "to": "0xaf0326d92b97dF1221759476B072abfd8084f9bE",
      }
    `)
    expect(rest).toMatchInlineSnapshot(`
      {
        "error": null,
        "fetchStatus": "idle",
        "internal": {
          "dataUpdatedAt": 1643673600000,
          "errorUpdatedAt": 0,
          "failureCount": 0,
          "isFetchedAfterMount": true,
          "isLoadingError": false,
          "isPaused": false,
          "isPlaceholderData": false,
          "isPreviousData": false,
          "isRefetchError": false,
          "isStale": true,
          "remove": [Function],
        },
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

  describe('errors', () => {
    it('contract method error', async () => {
      const utils = renderHook(() =>
        usePrepareContractWriteWithConnect({
          ...mlootContractConfig,
          functionName: 'claim',
          args: 1,
        }),
      )
      const { result, waitFor } = utils

      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.prepareContractTransaction.isError).toBeTruthy(),
      )

      const { config, data, ...rest } =
        result.current.prepareContractTransaction
      expect(config).toBeDefined()
      expect(data).toBeUndefined()
      expect(rest).toMatchInlineSnapshot(`
        {
          "error": [Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\\"jsonrpc\\":\\"2.0\\",\\"id\\":42,\\"error\\":{\\"code\\":3,\\"message\\":\\"execution reverted: Token ID invalid\\",\\"data\\":\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\"}}","error":{"code":3,"data":"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000"},"requestBody":"{\\"method\\":\\"eth_estimateGas\\",\\"params\\":[{\\"from\\":\\"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266\\",\\"to\\":\\"0x1dfe7ca09e99d10835bf73044a23b73fc20623df\\",\\"data\\":\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\"}],\\"id\\":42,\\"jsonrpc\\":\\"2.0\\"}","requestMethod":"POST","url":"http://127.0.0.1:8545"}, method="estimateGas", transaction={"from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF","data":"0x379607f50000000000000000000000000000000000000000000000000000000000000001","accessList":null}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.6.5)],
          "fetchStatus": "idle",
          "internal": {
            "dataUpdatedAt": 0,
            "errorUpdatedAt": 1643673600000,
            "failureCount": 1,
            "isFetchedAfterMount": true,
            "isLoadingError": true,
            "isPaused": false,
            "isPlaceholderData": false,
            "isPreviousData": false,
            "isRefetchError": false,
            "isStale": true,
            "remove": [Function],
          },
          "isError": true,
          "isFetched": true,
          "isFetching": false,
          "isIdle": false,
          "isLoading": false,
          "isRefetching": false,
          "isSuccess": false,
          "refetch": [Function],
          "status": "error",
        }
      `)
    })

    it('contract function not found', async () => {
      const utils = renderHook(() =>
        usePrepareContractWriteWithConnect({
          ...wagmiContractConfig,
          // @ts-expect-error function name does not exist
          functionName: 'wagmi',
        }),
      )
      const { result, waitFor } = utils

      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.prepareContractTransaction.isError).toBeTruthy(),
      )

      const { config, data, ...rest } =
        result.current.prepareContractTransaction
      expect(config).toBeDefined()
      expect(data).toBeUndefined()
      expect(rest).toMatchInlineSnapshot(`
        {
          "error": [ContractMethodDoesNotExistError: Function "wagmi" on contract "0xaf0326d92b97df1221759476b072abfd8084f9be" does not exist.

        Etherscan: https://etherscan.io/address/0xaf0326d92b97df1221759476b072abfd8084f9be#readContract],
          "fetchStatus": "idle",
          "internal": {
            "dataUpdatedAt": 0,
            "errorUpdatedAt": 1643673600000,
            "failureCount": 1,
            "isFetchedAfterMount": true,
            "isLoadingError": true,
            "isPaused": false,
            "isPlaceholderData": false,
            "isPreviousData": false,
            "isRefetchError": false,
            "isStale": true,
            "remove": [Function],
          },
          "isError": true,
          "isFetched": true,
          "isFetching": false,
          "isIdle": false,
          "isLoading": false,
          "isRefetching": false,
          "isSuccess": false,
          "refetch": [Function],
          "status": "error",
        }
      `)
    })
  })

  describe('types', () => {
    describe('args', () => {
      it('zero', () => {
        renderHook(() =>
          usePrepareContractWrite({
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
          }),
        )
      })

      it('one', () => {
        renderHook(() =>
          usePrepareContractWrite({
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
        renderHook(() =>
          usePrepareContractWrite({
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

      it('wrong arg type', () => {
        renderHook(() =>
          usePrepareContractWrite({
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
          }),
        )
      })
    })

    describe('behavior', () => {
      it('write function not allowed', () => {
        renderHook(() =>
          usePrepareContractWrite({
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
        renderHook(() =>
          usePrepareContractWrite({
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
