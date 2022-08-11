import * as React from 'react'
import { useContractWrite, usePrepareContractWrite } from 'wagmi'

import { anvAbi } from './anv-abi'

export const WriteContractPrepared = () => {
  const [args] = React.useState<number | string>(56)
  const { config } = usePrepareContractWrite({
    addressOrName: '0xe614fbd03d58a60fd9418d4ab5eb5ec6c001415f',
    contractInterface: anvAbi,
    functionName: 'claim',
    args: typeof args === 'string' ? parseInt(args) : args,
  })
  const { write, data, error, isLoading, isError, isSuccess } =
    useContractWrite(config)

  return (
    <div>
      <div>Mint an Adjective Noun Verb:</div>
      <button disabled={isLoading || !write} onClick={() => write?.()}>
        Mint
      </button>
      {isError && <div>{error?.message}</div>}
      {isSuccess && <div>Transaction hash: {data?.hash}</div>}
    </div>
  )
}
