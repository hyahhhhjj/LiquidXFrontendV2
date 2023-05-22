import React from 'react'

export default function Wallet(props) {

    let wallet_obj
    if (props.wallet.component === 0) {
        wallet_obj = <button className="wallet_btn_1" onClick={props.handler}>{props.wallet.info}</button>
    }
    else if (props.wallet.component === 1) {
        wallet_obj = <div className="wallet_panel_1">
            <img src="/src/assets/profile.png" className="wallet_panel_img" />
            <p className="wallet_panel_text">{props.wallet.address}</p>
        </div>
    }
    return (
        <div className="wallet_container">
            {wallet_obj}
        </div>
        )
}