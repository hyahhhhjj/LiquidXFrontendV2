import React from 'react'
import Web3 from 'web3'
import LiquidXAggregator from '../contract_abi/LiquidXAggregator.json'
import ManagerAccount from '../contract_abi/ManagerAccount.json'
import ILBLegacyPair from '../contract_abi/ILBLegacyPair.json'
import ERC20 from '../contract_abi/ERC20.json'
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryStack, VictoryVoronoiContainer, VictoryTooltip } from 'victory';
import { calBorrowable, toEtherFixedFloat, getPlaceHolder, toEtherFixedString, fromEtherToWei } from '../utils/utils'

export default function Manage(props) {
    console.log("Manage initialized")

    const USDTADDRESS = "0x6658081AbdAA15336b54763662B46966008E8953"
    const WBNBADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
    const ZEROADDRESS = '0x0000000000000000000000000000000000000000'
    const PAIRADDRESS = '0x5f79ABacC763A61AD7ffEaa01a8b6Fd9F1856C2e'
    
    const [data, setData] = React.useState({
        params: {
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
        },
        data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
            { x: 3, y: 30 },
            { x: 4, y: 40 },
            { x: 5, y: 50 },
        ],
        isDragging: false,
        startY: null,
        barIndex: null,
        barValue: null
    })

    console.log(data)

    const [accountState, setAccountState] = React.useState({ accountIf: false, accountAddress: ZEROADDRESS})

    function getAccounState() {
        if (props.wallet.component === 1) {
            const aggregator = new web3.eth.Contract(LiquidXAggregator["abi"], '0x917E3bcb5665bcd46D7a758b4F37C84D87790921')
            aggregator.methods.getAccount(props.wallet.fullAddress).call(function (error, result) {
                if (result != ZEROADDRESS) {
                    setAccountState({ accountIf: true, accountAddress: result })
                } else {
                    setAccountState({ accountIf: false, accountAddress: result })
                }
            })
        }
    }

    const [accountInfo, setAccountInfo] = React.useState({
        usdt_borrowed: 0.0, wbnb_borrowed: 0.0, usdt_available: 0.0, wbnb_available: 0.0,
        usdtBorrowable: 0.0, wbnbBorrowable: 0.0,
        usdtUserAvailable: 0.0, wbnbUserAvailable: 0.0,
        usdtInputAccountBorrow: "", wbnbInputAccountBorrow: "",
        usdtInputUserDeposit: "", wbnbInputUserDeposit: "",
        usdtInputAddLiquiidty: "", wbnbInputAddLiquidity: ""
    })

    async function syncLiquidityShape() {
        let amountTBUSDEther = accountInfo.usdtInputAddLiquiidty
        let amountWBNBEther = accountInfo.wbnbInputAddLiquidity
        const binStep = 0.0015
        const bpValue = 1.0015
        const amountTBUSDWei = fromEtherToWei(amountTBUSDEther)
        const amountWBNBWei = fromEtherToWei(amountWBNBEther)
        const pairV2 = new web3.eth.Contract(ILBLegacyPair["abi"], '0x5f79ABacC763A61AD7ffEaa01a8b6Fd9F1856C2e')
        pairV2.methods.getReservesAndId().call(function (error, result) {
            const activeId = result.activeId
            pairV2.methods.getBin(activeId).call(function (error, result) {
                const binReserveX = parseInt(result.reserveX)
                const binReserveY = parseInt(result.reserveY)
                const realIDInt = parseInt(activeId) - 2 ** 23
                const binPrice1 = bpValue ** realIDInt
                const xWeiInt = parseInt(amountTBUSDWei)
                const yWeiInt = parseInt(amountWBNBWei)

                let LmaxX = (binPrice1 + binReserveY / binReserveX) * xWeiInt
                let LmaxY = (binPrice1 * binReserveX / binReserveY + 1) * yWeiInt

                var Lmin

                if (LmaxX > LmaxY) {
                    Lmin = LmaxY
                } else {
                    Lmin = LmaxX
                }

                const lPiece = Math.floor(Lmin / 9) /* this can be set mannually */

                let xAccumulateWei = 0
                let yAccumulateWei = 0

                let lShape = []
                let xAmountShape = []
                let yAmountShape = []

                let xDistribution = []
                let yDistribution = []
                let deltaIds = []

                let index = 0
                while (true) {
                    console.log("loop")
                    
                    if (index === 0) {
                        const x0In = Math.floor(lPiece / (binPrice1 + binReserveY / binReserveX))
                        const y0In = Math.floor(lPiece / (binPrice1 * binReserveX / binReserveY + 1))

                        xAccumulateWei += x0In
                        yAccumulateWei += y0In
                        lShape.push({ x: parseInt(activeId), y: lPiece })

                        xAmountShape.push(x0In)
                        yAmountShape.push(y0In)
                        deltaIds.push(index)
                    }
                    else {
                        let binPricePlus = binPrice1 * (bpValue) ** (index)
                        let binPriceMinus = binPrice1 * (bpValue) ** (0 - index)

                        const xIn = Math.floor(lPiece / binPricePlus)
                        const yIn = Math.floor(lPiece)

                        if ((xAccumulateWei + xIn < xWeiInt) && (yAccumulateWei + yIn < yWeiInt)) {
                            xAccumulateWei += xIn
                            yAccumulateWei += yIn

                            lShape.unshift({ x: parseInt(activeId) - index, y: lPiece })
                            lShape.push({ x: parseInt(activeId) + index, y: lPiece })

                            xAmountShape.push(xIn)
                            xAmountShape.unshift(0)
                            yAmountShape.push(0)
                            yAmountShape.unshift(yIn)
                            deltaIds.push(index)
                            deltaIds.unshift(0 - index)
                        } else {
                            break
                        }
                    }
                    console.log(yAmountShape)
                    console.log(yAccumulateWei)
                    index += 1
                }
                for (let i = 0; i < xAmountShape.length; i++) {
                    const xi = String(Math.floor(xAmountShape[i] * (1e18 * 0.999) / xAccumulateWei))
                    const yi = String(Math.floor(yAmountShape[i] * (1e18 * 0.999) / yAccumulateWei))
                    xDistribution.push(xi)
                    yDistribution.push(yi)
                }
                setData((prevData) => {
                    return ({
                        ...prevData,
                        data: lShape,
                        params: {
                            tokenX: '0x6658081AbdAA15336b54763662B46966008E8953',
                            tokenY: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
                            binStep: 15,
                            amountX: xAccumulateWei,
                            amountY: yAccumulateWei,
                            amountXMin: 0,
                            amountYMin: 0,
                            activeIdDesired: activeId,
                            idSlippage: activeId,
                            deltaIds: deltaIds,
                            distributionX: xDistribution,
                            distributionY: yDistribution,
                            to: '0x381836196E04eAb47504225E106f85ce86174983',
                            deadline: 1693399470
                        }
                    })
                })
            })
        })
    }

    async function syncManageInfo() {
        if (accountState.accountIf === true) {
            const aggregator = new web3.eth.Contract(LiquidXAggregator["abi"], '0x917E3bcb5665bcd46D7a758b4F37C84D87790921')
            const account = new web3.eth.Contract(ManagerAccount["abi"], accountState.accountAddress)
            const tbusd = new web3.eth.Contract(ERC20["abi"], "0x6658081AbdAA15336b54763662B46966008E8953")
            const wbnb = new web3.eth.Contract(ERC20["abi"], "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd")
            const usdt_borrowed = await aggregator.methods.getManagerBorrowedAmount(accountState.accountAddress, '0x6658081AbdAA15336b54763662B46966008E8953').call()
            const wbnb_borrowed = await aggregator.methods.getManagerBorrowedAmount(accountState.accountAddress, '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd').call()
            const usdt_available = await account.methods.getAccountBalanceAvailable('0x6658081AbdAA15336b54763662B46966008E8953').call()
            const wbnb_available = await account.methods.getAccountBalanceAvailable('0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd').call()
            aggregator.methods.getMarginAvailableByAsset(accountState.accountAddress, '0x6658081AbdAA15336b54763662B46966008E8953').call(function (error, result) {
                let available = result
                account.methods.getCredit().call(function (error, result) {
                    let credit = result
                    let borrowable = calBorrowable(credit, available)
                    setAccountInfo((prevData) => {
                        return ({
                            ...prevData,
                            usdtBorrowable: borrowable
                        })
                    })
                })
            })
            aggregator.methods.getMarginAvailableByAsset(accountState.accountAddress, '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd').call(function (error, result) {
                let available = result
                account.methods.getCredit().call(function (error, result) {
                    let credit = result
                    let borrowable = calBorrowable(credit, available)
                    setAccountInfo((prevData) => {
                        return ({
                            ...prevData,
                            wbnbBorrowable: borrowable
                        })
                    })
                })
            })
            tbusd.methods.balanceOf(props.wallet.fullAddress).call(function (error, result) {
                const etherStr = toEtherFixedString(result, 6)
                setAccountInfo((prevData) => {
                    return ({
                        ...prevData,
                        usdtUserAvailable: etherStr
                    })
                })
            })
            wbnb.methods.balanceOf(props.wallet.fullAddress).call(function (error, result) {
                const etherStr = toEtherFixedString(result, 6)
                setAccountInfo((prevData) => {
                    return ({
                        ...prevData,
                        wbnbUserAvailable: etherStr
                    })
                })
            })
            setAccountInfo((prevData) => {
                return ({
                    ...prevData,
                    usdt_borrowed: toEtherFixedFloat(usdt_borrowed, 6),
                    wbnb_borrowed: toEtherFixedFloat(wbnb_borrowed, 6),
                    usdt_available: toEtherFixedFloat(usdt_available, 6),
                    wbnb_available: toEtherFixedFloat(wbnb_available, 6)
                })
            })
        } else {
            console.log("account not created yet")
        }
    }

    function handleData(value, index) {
        console.log(index)
        setData(prevData => {
            const newData = prevData.data.map((d, i) => {
                if (i == index) {
                    return { ...d, y: value}
                }
                return d
            });
            console.log(newData)
            return { ...prevData, data: newData }
        })
    }

    function handleMouseDown(event, clickedDatum, clickedIndex) {
        setData(prevData => {
            return { ...prevData, startY: event.clientY, isDragging: true, barIndex: clickedIndex, barValue: data.data[clickedIndex].y }
        })
    }

    function handleMouseMove(event) {
        if (data.isDragging === true) {
            let distY
            if (event.clientY < data.startY) {
                distY = data.startY - event.clientY
                handleData((distY / 256 + 1) * data.barValue, data.barIndex)
            }
            else if (data.barValue > 0){
                distY = event.clientY - data.startY
                handleData((1 - distY / 256) * data.barValue, data.barIndex)
            }
        }
    }

    function handleMouseUp(event) {
        setData(prevData => {
            return {
            ...prevData,
            isDragging: false,
            startY: null,
            barIndex: null,
            barValue: null
            }
        })
    }

    async function handleClickAccount() {
        if (props.wallet.component === 1) {
            const aggregator = new web3.eth.Contract(LiquidXAggregator["abi"], '0x917E3bcb5665bcd46D7a758b4F37C84D87790921')
            await aggregator.methods.createManagerAccount(props.wallet.fullAddress, "0xf7C6d73336f333b63144644944176072D94128F5").send({ from: props.wallet.fullAddress })
            getAccounState()
        }
    }

    function handleValueChange(event) {
        if (event.target.id === "debt_usdt_input") {
            setAccountInfo((prevData) => {
                return ({
                    ...prevData,
                    usdtInputAccountBorrow: event.target.value
                })
            })
        } else if (event.target.id === "debt_wbnb_input") {
            setAccountInfo((prevData) => {
                return ({
                    ...prevData,
                    wbnbInputAccountBorrow: event.target.value
                })
            })
        } else if (event.target.id === "deposit_usdt_input") {
            setAccountInfo((prevData) => {
                return ({
                    ...prevData,
                    usdtInputUserDeposit: event.target.value
                })
            })
        } else if (event.target.id === "deposit_wbnb_input") {
            setAccountInfo((prevData) => {
                return ({
                    ...prevData,
                    wbnbInputUserDeposit: event.target.value
                })
            })
        } else if (event.target.id === "input_liquidty_usdt") {
            setAccountInfo((prevData) => {
                return ({
                    ...prevData,
                    usdtInputAddLiquiidty: event.target.value
                })
            })
        } else if (event.target.id === "input_liquidty_wbnb") {
            setAccountInfo((prevData) => {
                return ({
                    ...prevData,
                    wbnbInputAddLiquidity: event.target.value
                })
            })
        }
    }

    async function handleClickAmount(event) {
        if (accountState.accountIf === true) {
            const tbusd = new web3.eth.Contract(ERC20["abi"], "0x6658081AbdAA15336b54763662B46966008E8953")
            const wbnb = new web3.eth.Contract(ERC20["abi"], "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd")
            const account = new web3.eth.Contract(ManagerAccount["abi"], accountState.accountAddress)
            let amount
            let allowance
            if (event.target.id === "btn_usdt_borrow") {
                try {
                    amount = fromEtherToWei(accountInfo.usdtInputAccountBorrow)
                    await account.methods.borrow(USDTADDRESS, amount).send({ from: props.wallet.fullAddress })
                    syncManageInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "btn_usdt_repay") {
                try {
                    await account.methids.repay(USDTADDRESS).send({ from: props.wallet.fullAddress })
                    syncManageInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "btn_wbnb_borrow") {
                try {
                    amount = fromEtherToWei(accountInfo.wbnbInputAccountBorrow)
                    await account.methods.borrow(WBNBADDRESS, amount).send({ from: props.wallet.fullAddress })
                    syncManageInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "btn_wbnb_repay") {
                try {
                    await account.methids.repay(WBNBADDRESS).send({ from: props.wallet.fullAddress })
                    syncManageInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "btn_usdt_deposit") {
                try {
                    amount = fromEtherToWei(accountInfo.usdtInputUserDeposit)
                    allowance = await tbusd.methods.allowance(props.wallet.fullAddress, accountState.accountAddress).call()
                    console.log(parseInt(amount))
                    console.log(parseInt(allowance))
                    if (parseInt(amount) > parseInt(allowance)) {
                        try {
                            await tbusd.methods.approve(accountState.accountAddress, amount).send({ from: props.wallet.fullAddress })
                        } catch (error) {
                            return
                        }
                    }
                    try {
                        await account.methods.deposit(USDTADDRESS, amount).send({ from: props.wallet.fullAddress })
                        syncManageInfo()
                    } catch (error) {
                        return
                    }
                } catch (error) {
                    console.log(error)
                    return
                }
            } else if (event.target.id === "btn_usdt_withdraw") {
                try {
                    amount = fromEtherToWei(accountInfo.usdtInputUserDeposit)
                    await account.methods.withdraw(USDTADDRESS, amount).send({ from: props.wallet.fullAddress })
                    syncManageInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "btn_wbnb_deposit") {
                try {
                    amount = fromEtherToWei(accountInfo.wbnbInputUserDeposit)
                    allowance = await wbnb.methods.allowance(props.wallet.fullAddress, accountState.accountAddress).call()
                    if (parseInt(amount) > parseInt(allowance)) {
                        try {
                            await wbnb.methods.approve(accountState.accountAddress, amount).send({ from: props.wallet.fullAddress })
                        } catch (error) {
                            return
                        }
                    }
                    try {
                        await account.methods.deposit(WBNBADDRESS, amount).send({ from: props.wallet.fullAddress })
                        syncManageInfo()
                    } catch (error) {
                        return
                    }
                } catch (error) {
                    return
                }
            } else if (event.target.id === "btn_wbnb_withdraw") {
                try {
                    amount = fromEtherToWei(accountInfo.wbnbInputUserDeposit)
                    await account.methods.withdraw(WBNBADDRESS, amount).send({ from: props.wallet.fullAddress })
                    syncManageInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "btn_add_liquidity") {
                await account.methods.addLiquidity("0x5f79ABacC763A61AD7ffEaa01a8b6Fd9F1856C2e", data.params).send({ from: props.wallet.fullAddress })
                syncManageInfo()
            } else if (event.target.id === "btn_remove_liquidity") {
                let ids_ = []
                let amounts_ = []
                for (let i = 0; i < data.data.length; i++) {
                    ids_.push(String(data.data[i].x))
                    amounts_.push(String(Math.floor(data.data[i].y)))
                }
                await account.methods.removeLiquidity("0x5f79ABacC763A61AD7ffEaa01a8b6Fd9F1856C2e", ids_, amounts_, 1693399470).send({ from: props.wallet.fullAddress })
                syncManageInfo()
            }
        } else {
            console.log("account not created yet")
        }
    }

    React.useEffect(() => {
        syncManageInfo()
    }, [accountState.accountIf])

    React.useEffect(() => {
        getAccounState()
    }, [props.wallet.component])

    React.useEffect(() => {
        syncLiquidityShape()
    }, [accountInfo.usdtInputAddLiquiidty, accountInfo.wbnbInputAddLiquidity])

    React.useEffect(() => {
        async function syncLiquidityUserMinted() {
            const account = new web3.eth.Contract(ManagerAccount["abi"], accountState.accountAddress)
            account.methods.getMMLBPairToIdSetLength(PAIRADDRESS).call(async function (error, result) {
                const idLength = parseInt(result)
                let newData = []
                for (let i = 0; i < idLength; i++) {
                    let id_ = await account.methods.getMMLBPairToIdSetAtValue(PAIRADDRESS, i).call()
                    let amount_ = await account.methods.getMMLBPairToIdToAmount(PAIRADDRESS, id_).call()
                    newData.push({ x: parseInt(id_), y: parseInt(amount_) })
                }
                const sortedNewData = newData.sort((a, b) => a.x - b.x)
                console.log(sortedNewData)
                setData((prevData) => {
                    return ({
                        ...prevData,
                        data: sortedNewData
                    })
                })
            })
        }
        if (accountState.accountIf === true) {
            syncLiquidityUserMinted()
        }
    }, [accountInfo.usdt_available, accountInfo.wbnb_available])

    return (accountState.accountIf ?
        <div onMouseMove={(event) => handleMouseMove(event)} onMouseUp={(event) => handleMouseUp(event)} className="manage_container">
            <div className="debt_table">
                <div className="debt_pagination">
                    <p className="debt_pagination_text">Debt</p>
                </div>
                <div className="debt_table_data">
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Assets</p>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_table_cell_image_text_desc">
                                <img src="/src/assets/USDT.png" className="debt_table_cell_image_left" />
                                <div className="debt_token_name_symbol_container">
                                    <p className="debt_token_name">USDT</p>
                                </div>
                            </div>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_table_cell_image_text_desc">
                                <img src="/src/assets/BNB.png" className="debt_table_cell_image_left" />
                                <div className="debt_token_name_symbol_container">
                                    <p className="debt_token_name">BNB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Borrowed</p>
                        </div>
                        <div className="debt_table_cell">
                            <p className="debt_table_cell_value">{accountInfo.usdt_borrowed}</p>
                        </div>
                        <div className="debt_table_cell">
                            <p className="debt_table_cell_value">{accountInfo.wbnb_borrowed}</p>
                        </div>
                    </div>
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Amount</p>
                        </div>
                        <div className="debt_table_cell">
                            <input className="debt_amount_input" id="debt_usdt_input" placeholder={accountInfo.usdtBorrowable} value={accountInfo.usdtInputAccountBorrow} onChange={(event) => handleValueChange(event)} />
                        </div>
                        <div className="debt_table_cell">
                            <input className="debt_amount_input" id="debt_wbnb_input" placeholder={accountInfo.wbnbBorrowable} value={accountInfo.wbnbInputAccountBorrow} onChange={(event) => handleValueChange(event)} />
                        </div>
                    </div>
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Actions</p>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_button_group">
                                <button className="debt_button_left" id="btn_usdt_borrow" onClick={handleClickAmount}>borrow</button>
                                <button className="debt_button_right" id="btn_usdt_repay" onClick={handleClickAmount}>repay</button>
                            </div>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_button_group">
                                <button className="debt_button_left" id="btn_wbnb_borrow" onClick={handleClickAmount}>borrow</button>
                                <button className="debt_button_right" id="btn_wbnb_repay" onClick={handleClickAmount}>repay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="available_table">
                <div className="debt_pagination">
                    <p className="debt_pagination_text">Balance</p>
                </div>
                <div className="debt_table_data">
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Assets</p>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_table_cell_image_text_desc">
                                <img src="/src/assets/USDT.png" className="debt_table_cell_image_left" />
                                <div className="debt_token_name_symbol_container">
                                    <p className="debt_token_name">USDT</p>
                                </div>
                            </div>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_table_cell_image_text_desc">
                                <img src="/src/assets/BNB.png" className="debt_table_cell_image_left" />
                                <div className="debt_token_name_symbol_container">
                                    <p className="debt_token_name">BNB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Available</p>
                        </div>
                        <div className="debt_table_cell">
                            <p className="debt_table_cell_value">{accountInfo.usdt_available}</p>
                        </div>
                        <div className="debt_table_cell">
                            <p className="debt_table_cell_value">{accountInfo.wbnb_available}</p>
                        </div>
                    </div>
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Amount</p>
                        </div>
                        <div className="debt_table_cell">
                            <input className="debt_amount_input" id="deposit_usdt_input" placeholder={accountInfo.usdtUserAvailable} value={accountInfo.usdtInputUserDeposit} onChange={(event) => handleValueChange(event)} />
                        </div>
                        <div className="debt_table_cell">
                            <input className="debt_amount_input" id="deposit_wbnb_input" placeholder={accountInfo.wbnbUserAvailable} value={accountInfo.wbnbInputUserDeposit} onChange={(event) => handleValueChange(event)}/>
                        </div>
                    </div>
                    <div className="debt_table_data_col">
                        <div className="debt_table_header_cell">
                            <p className="debt_table_header_cell_text_p">Actions</p>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_button_group">
                                <button className="debt_button_left" id="btn_usdt_deposit" onClick={handleClickAmount}>deposit</button>
                                <button className="debt_button_right" id="btn_usdt_withdraw" onClick={handleClickAmount}>withdraw</button>
                            </div>
                        </div>
                        <div className="debt_table_cell">
                            <div className="debt_button_group">
                                <button className="debt_button_left" id="btn_wbnb_deposit" onClick={handleClickAmount}>deposit</button>
                                <button className="debt_button_right" id="btn_wbnb_withdraw" onClick={handleClickAmount}>withdraw</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="addliquidity_field">
                <div className="token_field">
                    <div className="token_input_field">
                        <input className="token_amount_input_field" id="input_liquidty_usdt" value={accountInfo.usdtInputAddLiquiidty} onChange={(event) => handleValueChange(event)} />
                        <p className="token_amount_input_right_symbol">USDT</p>
                    </div>
                    <div className="token_input_hint">
                        <img src="/src/assets/hint.png" className="token_amount_hint_img" />
                        <p className="token_amount_hint_text">available: {accountInfo.usdt_available}</p>
                    </div>
                </div>
                <img src="/src/assets/Plus.png" className="token_plus_img" />
                <div className="token_field">
                    <div className="token_input_field">
                        <input className="token_amount_input_field" id="input_liquidty_wbnb" value={accountInfo.wbnbInputAddLiquiidty} onChange={(event) => handleValueChange(event)}/>
                        <p className="token_amount_input_right_symbol">BNB</p>
                    </div>
                    <div className="token_input_hint">
                        <img src="/src/assets/hint.png" className="token_amount_hint_img" />
                        <p className="token_amount_hint_text">available: {accountInfo.wbnb_available}</p>
                    </div>
                </div>
            </div>
            <div className="distribution_container" >
                <p className="distribution_text">even spread</p>
                <img src="/src/assets/uniform.png" className="distribution_img" />
            </div>
            <div className="graph_container">
                <VictoryChart
                    theme={VictoryTheme.grayscale}
                    domainPadding={20}
                    containerComponent={
                        <VictoryVoronoiContainer
                            labels={({ datum }) => `y: ${datum.y}`}
                            labelComponent={<VictoryTooltip />}
                        />
                    }
                >
                    <VictoryAxis />
                    <VictoryAxis dependentAxis />
                    <VictoryStack>
                        <VictoryBar
                            data={data.data} x="x" y="y"
                            events={[
                                {
                                    target: "data",
                                    eventHandlers: {
                                        onMouseDown: (event, clickedDatum, clickedIndex) => {
                                            handleMouseDown(event, clickedDatum, clickedIndex)
                                        }
                                    }
                                }
                            ]}
                        />
                    </VictoryStack>
                </VictoryChart>
                <div className="liquidity_button_group">
                    <button className="liquidity_button" id="btn_add_liquidity" onClick={(event) => handleClickAmount(event)}>Add Liquidity</button>
                    <button className="liquidity_button" id="btn_remove_liquidity" onClick={(event) => handleClickAmount(event)}>Remove Liquidity</button>
                </div>
            </div>
        </div> :
        <div className="createbtn_container">
            <button className="wallet_btn_1" onClick={handleClickAccount}>Create Account</button>
        </div>
        )
}