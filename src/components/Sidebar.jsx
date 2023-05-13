import React from 'react'

export default function Sidebar(props) {
    return (
        <div className="sideBar_menu_light">
            <div className="nav_items">
                <div className="top_nav">
                    <div className="logo">
                        <div className="logo_sub">
                            <div className="logo_sub_sub">
                                <img className="logo_sub_sub_image" src="/src/assets/liquidx_head.png" />
                                <div className="logo_type">LiquidX</div>
                            </div>
                        </div>
                    </div>
                    <div className="top_nav_sub">
                        <div className="nav_item_light" >
                            <div className="nav_item">
                                <img className="md_left_icon" src="/src/assets/stake_icon.png" />
                                <p className="md_left_text" id="s_1000" onClick={(event) => props.module_handler(event)}>Stake</p>
                            </div>
                        </div>
                        <div className="nav_item_light" >
                            <div className="nav_item">
                                <img className="md_left_icon" src="/src/assets/manage_icon.png" />
                                <p className="md_left_text" id="s_1001" onClick={(event) => props.module_handler(event)}>Manage</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bottom_nav"></div>
            </div>
        </div>
        )
}