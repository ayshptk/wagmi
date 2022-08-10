import { Abi, ExtractAbiFunctionNames } from 'abitype'
import { Contract, ContractInterface } from 'ethers/lib/ethers'

function isPlainArray(value: unknown) {
  return Array.isArray(value) && Object.keys(value).length === value.length
}

export function parseContractResult<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>,
>({
  contractInterface,
  data,
  functionName,
}: {
  contractInterface: TAbi
  data: any
  functionName: TFunctionName
}) {
  if (data && isPlainArray(data)) {
    const iface = Contract.getInterface(<ContractInterface>contractInterface)
    const fragment = iface.getFunction(functionName)

    const isTuple = (fragment.outputs?.length || 0) > 1

    const data_ = isTuple ? data : [data]
    const encodedResult = iface.encodeFunctionResult(functionName, data_)
    const decodedResult = iface.decodeFunctionResult(
      functionName,
      encodedResult,
    )
    return isTuple ? decodedResult : decodedResult[0]
  }
  return data
}
