import { useState } from 'react'
import { useContractRead } from 'wagmi'

import { wagmigotchiAbi } from './wagmigotchi-abi'

const wagmigotchiContractConfig = {
  addressOrName: '0xecb504d39723b0be0e3a9aa33d646642d1051ee1',
  contractInterface: wagmigotchiAbi,
}

export const ReadContract = () => {
  return (
    <div>
      <div>
        <GetAlive />
      </div>
      {false && (
        <div>
          <Love />
        </div>
      )}
    </div>
  )
}

const GetAlive = () => {
  const { data, isRefetching, isSuccess, refetch } = useContractRead({
    ...wagmigotchiContractConfig,
    contractInterface: [
      {
        type: 'function',
        name: 'foo',
        inputs: [
          { type: 'address', name: 'merp' },
          { type: 'bool[2]', name: 'meep' },
        ],
        outputs: [],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'bar',
        inputs: [],
        outputs: [],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'boo',
        inputs: [{ type: 'address', name: 'address' }],
        outputs: [
          {
            type: 'string',
            name: 'merp',
          },
        ],
        stateMutability: 'view',
      },
    ] as const,
    functionName: 'boo',
    // args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', [true, true]],
    args: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  })

  return (
    <div>
      Is wagmigotchi alive?: {isSuccess && <span>{data ? 'yes' : 'no'}</span>}
      <button
        disabled={isRefetching}
        onClick={() => refetch()}
        style={{ marginLeft: 4 }}
      >
        {isRefetching ? 'loading...' : 'refetch'}
      </button>
    </div>
  )
}

const Love = () => {
  const [address, setAddress] = useState<string>('')
  const { data, isFetching, isRefetching, isSuccess } = useContractRead({
    ...wagmigotchiContractConfig,
    functionName: 'love',
    args: [address],
    enabled: Boolean(address),
  })

  const [value, setValue] = useState('')

  return (
    <div>
      Get wagmigotchi love:
      <input
        onChange={(e) => setValue(e.target.value)}
        placeholder="wallet address"
        style={{ marginLeft: 4 }}
        value={value}
      />
      <button onClick={() => setAddress(value)}>
        {isFetching
          ? isRefetching
            ? 'refetching...'
            : 'fetching...'
          : 'fetch'}
      </button>
      {isSuccess && <div>{data?.toString()}</div>}
    </div>
  )
}
