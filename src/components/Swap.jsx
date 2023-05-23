import React from 'react'
import Web3 from 'web3';
import ILBRouter from '../contract_abi/ILBRouter.json'
import ERC20 from '../contract_abi/ERC20.json'
import ILBPair from '../contract_abi/ILBLegacyPair.json'
import { toEtherFixedFloat, toEtherFixedString, divFixedFloat, getPlaceHolder, fromEtherToWei } from '../utils/utils'
export default function Swap(props) {
    console.log("Swap initialized")

    const ROUTER = "0x394F548A0AeB144355713733Eeef6ea023913c37"

    const PAIR = "0xf2c32a1ac4c19d23920cfb68a9b8e46aba7cd5ce"

    const BINSTEP = 20

    const bpValue = 1 + 0.0001 * BINSTEP

    const TUSDT = '0x6a0Df378CbD9cfdb27448ba9Da327cb6EE681Cc1'

    const WBNB = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'

    const CORRELATION = 0.999

    const [state, setState] = React.useState({ amountInput: 0, amountOutput: 0, currentToken: "USDT" })

    const [data, setData] = React.useState({ balanceUp: 0, balanceDown: 0, exchangeRate: 0, approveIf: false })

    console.log(data)

    function syncData() {
        if (props.wallet.component === 1) {

            const web3 = new Web3(window.ethereum)

            const routerInterface = new web3.eth.Contract(ILBRouter["abi"], ROUTER)

            const pairInterface = new web3.eth.Contract(ILBPair["abi"], PAIR)

            const usdtInterface = new web3.eth.Contract(ERC20["abi"], TUSDT)

            const wbnbInterface = new web3.eth.Contract(ERC20["abi"], WBNB)

            if (state.currentToken == "USDT") {
                usdtInterface.methods.balanceOf(props.wallet.fullAddress).call(function (error, result) {
                    const balanceUp = toEtherFixedFloat(result, 2)
                    wbnbInterface.methods.balanceOf(props.wallet.fullAddress).call(function (error, result) {
                        const balanceDown = toEtherFixedFloat(result, 2)
                        pairInterface.methods.getReservesAndId().call(function (error, result) {
                            const activeId = result.activeId
                            const realIDInt = parseInt(activeId) - 2 ** 23
                            const binPrice = bpValue ** realIDInt
                            setData(prevData => {
                                return ({
                                    ...prevData,
                                    balanceUp: balanceUp,
                                    balanceDown: balanceDown,
                                    exchangeRate: parseFloat(binPrice.toFixed(5))
                                })
                            })
                        })
                    })
                })
            } else {
                usdtInterface.methods.balanceOf(props.wallet.fullAddress).call(function (error, result) {
                    const balanceDown = toEtherFixedFloat(result, 2)
                    wbnbInterface.methods.balanceOf(props.wallet.fullAddress).call(function (error, result) {
                        const balanceUp = toEtherFixedFloat(result, 2)
                        pairInterface.methods.getReservesAndId().call(function (error, result) {
                            const activeId = result.activeId
                            const realIDInt = parseInt(activeId) - 2 ** 23
                            const binPrice = bpValue ** realIDInt
                            const binPriceReverse = 1 / binPrice
                            setData(prevData => {
                                return ({
                                    ...prevData,
                                    balanceUp: balanceUp,
                                    balanceDown: balanceDown,
                                    exchangeRate: parseFloat(binPriceReverse.toFixed(5))
                                })
                            })
                        })
                    })
                })
            }

        }
    }

    async function handleClick(event) {
        if (props.wallet.component === 1) {
            if (event.target.id === "switch_button") {
                setState(prevState => {
                    return ({
                        ...prevState,
                        currentToken: prevState.currentToken === "USDT" ? "WBNB" : "USDT"
                    })
                })
            } else if (event.target.id === "swap_button") {
                const web3 = new Web3(window.ethereum)
                const routerInterface = new web3.eth.Contract(ILBRouter["abi"], ROUTER)
                const usdtInterface = new web3.eth.Contract(ERC20["abi"], TUSDT)
                const wbnbInterface = new web3.eth.Contract(ERC20["abi"], WBNB)
                if (state.currentToken === "USDT") {
                    let amountIn = fromEtherToWei(state.amountInput)
                    let allowance = await usdtInterface.methods.allowance(props.wallet.fullAddress, ROUTER).call()
                    if (parseInt(amountIn) > parseInt(allowance)) {
                        await usdtInterface.methods.approve(ROUTER, amountIn).send({ from: props.wallet.fullAddress })
                    }
                    await routerInterface.methods.swapExactTokensForTokens(amountIn, "0", [20], ["0x6a0Df378CbD9cfdb27448ba9Da327cb6EE681Cc1", "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"], props.wallet.fullAddress, 1693399470).send({ from: props.wallet.fullAddress })
                    syncData()
                } else {
                    let amountIn = fromEtherToWei(state.amountInput)
                    let allowance = await wbnbInterface.methods.allowance(props.wallet.fullAddress, ROUTER).call()
                    if (parseInt(amountIn) > parseInt(allowance)) {
                        await wbnbInterface.methods.approve(ROUTER, amountIn).send({ from: props.wallet.fullAddress })
                    }
                    await routerInterface.methods.swapExactTokensForTokens(amountIn, "0", [20], ["0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", "0x6a0Df378CbD9cfdb27448ba9Da327cb6EE681Cc1"], props.wallet.fullAddress, 1693399470).send({ from: props.wallet.fullAddress })
                    syncData()
                }
            } else if (event.target.id == "max_button") {
                const amountInMax = parseFloat(data.balanceUp) * CORRELATION
                setState(prevData => {
                    return ({
                        ...prevData,
                        amountInput: amountInMax.toFixed(4)
                    })
                })
            }
        }
    }

    function handleValueChange(event) {
        setState(prevData => {
            return ({
                ...prevData,
                amountInput: event.target.value
            })
        })
    }

    function syncAmountOut() {
        if (props.wallet.component === 1 && data.exchangeRate != 0) {
            const amountOutput = (data.exchangeRate * parseFloat(state.amountInput)).toFixed(4)
            setState(prevData => {
                return ({
                    ...prevData,
                    amountOutput: amountOutput
                })
            })
        }
    }

    React.useEffect(() => {
        syncData()
    }, [state.currentToken, props.wallet.component])

    React.useEffect(() => {
        syncAmountOut()
    }, [state.amountInput])

    return (
        <div className="swap_modal">
            <div className="modal_main">
                <div className="swap_from">
                    <div className="swap_modal_header">
                        <div className="swap_header">
                            <p className="swap_header_text">Swap Assets</p>
                        </div>
                        <div className="swap_divider_horizontal">
                        </div>
                    </div>
                    <div className="swap_from_token">
                        <div className="swap_amount_frame">
                            <div className="swap_input_frame">
                                <div className="swap_amount">
                                    <input className="swap_amount_input" value={state.amountInput} onChange={(event) => handleValueChange(event)} />
                                </div>
                                <div className="swap_amount_shortcuts">
                                    <button className="swap_amount_shortcut" id="max_button" onClick={(event) => handleClick(event)}>Max</button>
                                </div>
                            </div>
                        </div>
                        <div className="swap_token_frame">
                            <div className="swap_token_dropdown">
                                <div className="swap_dropdown">
                                    <img className="swap_dropdown_img_up" src={state.currentToken === "USDT" ? "/src/assets/USDT.png" : "/src/assets/BNB.png" } />
                                    <p className="swap_dropdown_symbol">{state.currentToken === "USDT" ? "USDT": "WBNB" }</p>
                                </div>
                                <p className="swap_balance">{`Balance:${data.balanceUp}`}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="swap_token">
                    <div className="swap_from_token">
                        <div className="swap_amount_frame">
                            <div className="swap_input_frame">
                                <div className="swap_amount">
                                    <p className="swap_amount_input" >{state.amountOutput}</p>
                                </div>
                                <div className="swap_amount_shortcuts">
                                </div>
                            </div>
                        </div>
                        <div className="swap_token_frame">
                            <div className="swap_token_dropdown">
                                <div className="swap_dropdown">
                                    <img className="swap_dropdown_img_up" src={state.currentToken === "USDT" ? "/src/assets/BNB.png" : "/src/assets/USDT.png"} />
                                    <p className="swap_dropdown_symbol">{state.currentToken === "USDT" ? "WBNB" : "USDT"}</p>
                                </div>
                                <p className="swap_balance">{`Balance:${data.balanceDown}`}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="swap_modal_lobby">
                    <div className="swap_modal_details_table">
                        <div className="swap_details">
                            <div className="swap_details_row">
                                <div className="swap_value_point">
                                    <img className="swap_value_point_img" src="/src/assets/hint_white.png" />
                                    <p className="swap_value_point_text">{state.currentToken === "USDT" ? `1 USDT = ${data.exchangeRate} WBNB` : `1 WBNB = ${data.exchangeRate} USDT`}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="swap_modal_actions">
                        <div className="swap_modal_actions_buttons_group">
                            <button className="swap_modal_actions_button" id="swap_button" onClick={(event) => handleClick(event)}>Swap</button>
                        </div>
                    </div>
                </div>
                <div className="switch_button_area" onClick={(event) => handleClick(event)}>
                    <img className="switch_button_img" src="/src/assets/switch_icon.png" id="switch_button"/>
                </div>
            </div>
        </div>
    )
}