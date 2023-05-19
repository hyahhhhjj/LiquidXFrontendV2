import React from 'react'
import Web3 from 'web3';
import LiquidXStakePool from '../contract_abi/LiquidXStakePool.json'
import ERC20 from '../contract_abi/ERC20.json'
import { toEtherFixedFloat, toEtherFixedString, divFixedFloat, getPlaceHolder, fromEtherToWei } from '../utils/utils'

export default function Stake(props) {
    console.log("Stake initialized")

    const TUSDTL = '0xA9afe1B2c52b63975aD1F39a9b490bb457BA15c7'
    const TBUSD = '0x6a0Df378CbD9cfdb27448ba9Da327cb6EE681Cc1'
    const WBNBL = '0xE50520BA255648Ec28E73979D185FA23ffc03Da7'
    const WBNB = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'

    const [state, setState] = React.useState({
        tr_usdt: 0, tr_bnb: 0, sp_usdt: 0, sp_bnb: 0,
        input_usdt: "", input_wbnb: "",
        avail_usdt: "available:0", avail_wbnb: "available:0"
    })

    async function syncStakeInfo() {
        if (props.wallet.component === 1) {
            const web3 = new Web3(window.ethereum)
            const tbusd_l = new web3.eth.Contract(LiquidXStakePool["abi"], TUSDTL)
            const tbusd = new web3.eth.Contract(ERC20["abi"], TBUSD)
            const wbnb_l = new web3.eth.Contract(LiquidXStakePool["abi"], WBNBL)
            const wbnb = new web3.eth.Contract(ERC20["abi"], WBNB)
            const totalReserve_tbusd = await tbusd_l.methods.getTotalReserve().call()
            const totalSupply_tbusdl = await tbusd_l.methods.totalSupply().call()
            const totalReserve_wbnb = await wbnb_l.methods.getTotalReserve().call()
            const totalSupply_wbnbl = await wbnb_l.methods.totalSupply().call()
            const accounts = await web3.eth.getAccounts()
            const account = accounts[0]
            tbusd.methods.balanceOf(account).call(function (error, result) {
                const placeholder_tbusd = getPlaceHolder(result, 8)
                setState((prevData) => {
                    return ({
                        ...prevData,
                        avail_usdt: placeholder_tbusd
                    })
                })
            })
            wbnb.methods.balanceOf(account).call(function (error, result) {
                const placeholder_wbnb = getPlaceHolder(result, 8)
                setState((prevData) => {
                    return ({
                        ...prevData,
                        avail_wbnb: placeholder_wbnb
                    })
                })
            })
            
            
            setState((prevData) => {
                return ({
                    ...prevData,
                    tr_usdt: toEtherFixedFloat(totalReserve_tbusd, 6),
                    tr_bnb: toEtherFixedFloat(totalReserve_wbnb, 6),
                    sp_usdt: divFixedFloat(totalReserve_tbusd, totalSupply_tbusdl, 6),
                    sp_bnb: divFixedFloat(totalReserve_wbnb, totalSupply_wbnbl, 6)
                })
            })
        }
    }

    function handleValueChange(event) {
        if (event.target.id === "usdt_input_1") {
            setState((prevData) => {
                return ({
                    ...prevData,
                    input_usdt: event.target.value
                })
            })
        } else if (event.target.id === "wbnb_input_1") {
            setState((prevData) => {
                return ({
                    ...prevData,
                    input_wbnb: event.target.value
                })
            })
        }
    }

    async function handleClick(event) {
        if (props.wallet.component === 1) {
            const tbusd = new web3.eth.Contract(ERC20["abi"], TBUSD)
            const wbnb = new web3.eth.Contract(ERC20["abi"], WBNB)
            const tbusd_l = new web3.eth.Contract(LiquidXStakePool["abi"], TUSDTL)
            const wbnb_l = new web3.eth.Contract(LiquidXStakePool["abi"], WBNBL)
            let amount
            let allowance
            if (event.target.id === "usdt_mint_1") {
                amount = fromEtherToWei(state.input_usdt)
                allowance = await tbusd.methods.allowance(props.wallet.fullAddress, TUSDTL).call()
                if (parseInt(amount) > parseInt(allowance)) {
                    try {
                        await tbusd.methods.approve(TUSDTL, amount).send({ from: props.wallet.fullAddress})
                    } catch (error) {
                        return
                    }
                }
                try {
                    await tbusd_l.methods.mintShare(amount).send({ from: props.wallet.fullAddress })
                    syncStakeInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "usdt_burn_1") {
                amount = fromEtherToWei(state.input_usdt)
                try {
                    await tbusd_l.methods.burnShare(amount).send({ from: props.wallet.fullAddress })
                    syncStakeInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "wbnb_mint_1") {
                amount = fromEtherToWei(state.input_wbnb)
                allowance = await wbnb.methods.allowance(props.wallet.fullAddress, WBNBL).call()
                if (parseInt(amount) > parseInt(allowance)) {
                    try {
                        await wbnb.methods.approve(WBNBL, amount).send({ from: props.wallet.fullAddress })
                    } catch (error) {
                        return
                    }
                }
                try {
                    await wbnb_l.methods.mintShare(amount).send({ from: props.wallet.fullAddress })
                    syncStakeInfo()
                } catch (error) {
                    return
                }
            } else if (event.target.id === "wbnb_burn_1") {
                amount = fromEtherToWei(state.input_wbnb)
                try {
                    await wbnb_l.methods.burnShare(amount).send({ from: props.wallet.fullAddress })
                    syncStakeInfo()
                } catch (error) {
                    return
                }
            }
        }
    }

    React.useEffect(() => {
        syncStakeInfo()
    }, [props.wallet.component])

    return (
        <div className="stake_container">
            <div className="pool_table">
                <div className="pool_table_pagination">
                    <p className="pool_table_pagination_text">All pools</p>
                </div>
                <div className="pool_table_data">
                    <div className="pool_table_data_col">
                        <div className="table_header_cell">
                            <p className="table_header_cell_text_p">pools</p>
                        </div>
                        <div className="table_cell">
                            <div className="table_cell_image_text_desc">
                                <img src="/src/assets/USDT.png" className="table_cell_image_left" />
                                <div className="token_name_symbol_container">
                                    <div className="token_name_symbol_heading">
                                        <p className="token_name">LX-USDT</p>
                                        <p className="token_symbol">•  USDT</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="table_cell">
                            <div className="table_cell_image_text_desc">
                                <img src="/src/assets/BNB.png" className="table_cell_image_left" />
                                <div className="token_name_symbol_container">
                                    <div className="token_name_symbol_heading">
                                        <p className="token_name">LX-BNB</p>
                                        <p className="token_symbol">•  BNB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pool_table_data_col">
                        <div className="table_header_cell">
                            <p className="table_header_cell_text_p">total reserve</p>
                        </div>
                        <div className="table_cell">
                            <p className="table_cell_value">{state.tr_usdt}</p>
                        </div>
                        <div className="table_cell">
                            <p className="table_cell_value">{state.tr_bnb}</p>
                        </div>
                    </div>
                    <div className="pool_table_data_col">
                        <div className="table_header_cell">
                            <p className="table_header_cell_text_p">share price</p>
                        </div>
                        <div className="table_cell">
                            <p className="table_cell_value">{state.sp_usdt}</p>
                        </div>
                        <div className="table_cell">
                            <p className="table_cell_value">{state.sp_bnb}</p>
                        </div>
                    </div>
                    <div className="pool_table_data_col">
                        <div className="table_header_cell">
                            <p className="table_header_cell_text_p">amount</p>
                        </div>
                        <div className="table_cell">
                            <input className="stake_amount_input" id="usdt_input_1" placeholder={state.avail_usdt} value={state.input_usdt} onChange={(event) => handleValueChange(event)} />
                        </div>
                        <div className="table_cell">
                            <input className="stake_amount_input" id="wbnb_input_1" placeholder={state.avail_wbnb} value={state.input_wbnb} onChange={(event) => handleValueChange(event)} />
                        </div>
                    </div>
                    <div className="pool_table_data_col">
                        <div className="table_header_cell">
                            <p className="table_header_cell_text_p">actions</p>
                        </div>
                        <div className="table_cell">
                            <div className="button_group">
                                <button className="action_button_left" id="usdt_mint_1" onClick={handleClick}>mint</button>
                                <button className="action_button_right" id="usdt_burn_1" onClick={handleClick}>burn</button>
                            </div>
                        </div>
                        <div className="table_cell">
                            <div className="button_group">
                                <button className="action_button_left" id="wbnb_mint_1" onClick={handleClick}>mint</button>
                                <button className="action_button_right" id="wbnb_burn_1" onClick={handleClick}>burn</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )
}