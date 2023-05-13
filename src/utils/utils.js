import Web3 from 'web3';
import ILBLegacyPair from '../contract_abi/ILBLegacyPair.json'

const LiquidityParameters = {
    tokenX: '0x6658081AbdAA15336b54763662B46966008E8953',
    tokenY: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    binStep: 15,
    amountX: 2000,
    amountY: 3000,
    amountXMin: 0,
    amountYMin: 0,
    activeIdDesired: 0,
    idSlippage: 0,
    deltaIds: [1, 2, 3],
    distributionX: [10, 20, 70],
    distributionY: [30, 50, 20],
    to: '0xEEeeEEEeeeEEEEeeeeeeeeEEEeeeeEeeeeeeeEEeE',
    deadline: 1693399470
};

/**
 * @param {any} wei
 * @param {number} to
 * @returns {number} 
 */
export function toEtherFixedFloat(wei, to) {
    var etherStr = Web3.utils.fromWei(wei, "ether")
    var etherFloat = parseFloat(etherStr)
    return etherFloat.toFixed(to)
}

/**
 * @param {any} wei
 * @param {number} to
 * @returns {string}
 */
export function toEtherFixedString(wei, to) {
    var float = toEtherFixedFloat(wei, to)
    return (String(float))
}
/**
 * @param {number} a -dividend
 * @param {number} to -denominator
 * @returns {number}
 */
export function divFixedFloat(a, b, to) {
    if (b != 0) {
        var result = a / b
        return result.toFixed(to)
    } else {
        return 0
    }
    
}
/**
 * @param {any} wei
 * @param {number} to
 * @returns {string}
 */
export function getPlaceHolder(wei, to) {
    var etherStr = toEtherFixedString(wei, to)
    return "available:" + etherStr
}
/**
 * @param {any} etherStr
 * @returns {string}
 */
export function fromEtherToWei(etherStr) {
    return Web3.utils.toWei(etherStr, 'ether')
}
/**
 * @param {string} credit
 * @param {string} available
 * @returns {string}
 */
export function calBorrowable(credit, available) {
    var leverageFloat = parseFloat(credit) * 10 / 2 ** 16
    var availableEtherFloat = toEtherFixedFloat(available, 10)
    return String((availableEtherFloat * leverageFloat * 0.99).toFixed(6))
}