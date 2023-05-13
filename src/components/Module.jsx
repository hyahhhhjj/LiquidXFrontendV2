import React from 'react'
import Manage from './Manage.jsx'
import Stake from './Stake.jsx'

export default function Module(props) {
    let module_obj;
    if (isNaN(props.module_type)) {
        module_obj = null
    } else if (props.module_type === 0) {
        module_obj = <Stake wallet={props.state.wallet} />
    } else if (props.module_type === 1) {
        module_obj = <Manage wallet={props.state.wallet} />
    } else {
        module_obj =  <div>Unknown module type: {props.module_type}</div>
    }
    return (
        <div className="module_container">
            {module_obj}
        </div>
    )
}