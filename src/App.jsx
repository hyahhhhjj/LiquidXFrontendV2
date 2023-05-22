import React from 'react'
import Sidebar from './components/Sidebar.jsx'
import Module from './components/Module.jsx'
import Wallet from './components/Wallet.jsx'
import Web3 from 'web3';

export default function App() {
    const BSC_TESTNET_ID = '0x61'
    const [module, setModule] = React.useState(() => 0)

    const [state, setState] = React.useState({
        wallet: { component: 0, address: '', info: 'Connect Wallet' ,fullAddress:''},
        stake: {},
        manage: {}
    })

    async function switchChain(chainId) {
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId }]
                });
                console.log('Switched to chain ID:', chainId);
                return true
            } catch (error) {
                console.error(error);
                return false
            }
        }
    }

    function moduleClickToggle(event) {
        var target = event.target
        if (target.id === "s_1000") setModule(0)
        else if (target.id === "s_1001") setModule(1)
    }

    async function connectWallet() {
        if (window.ethereum) {
            await window.ethereum.request({ method: "eth_requestAccounts" })
            window.web3 = new Web3(window.ethereum)
            var web3 = window.web3
            web3.eth.getAccounts(async function (error, result) {
                var first_account = result[0]
                var sliced_account = first_account.slice(0, 7)
                const chainId = await window.ethereum.request({ method: 'eth_chainId' })
                if (chainId != BSC_TESTNET_ID) {
                    var switchIf = switchChain(BSC_TESTNET_ID)
                    if (switchIf) {

                        setState((prevData) => {
                            return { ...prevData, wallet: { component: 1, address: sliced_account + "...", fullAddress: first_account } }
                        })
                    }
                } else {
                    setState((prevData) => {
                        return { ...prevData, wallet: { component: 1, address: sliced_account + "...", fullAddress: first_account } }
                    })
                }

            })
        } else {
            setState((prevData) => {
                return { ...prevData, wallet: { component: 0, address: '', info: 'Wallet Not Installed', fullAddress: first_account } }
            })
        }
    }

    React.useEffect(() => {
        connectWallet()
    }, [0])

    return (
        <main>
            <Wallet wallet={state.wallet} handler={connectWallet} />
            <Sidebar module_handler={moduleClickToggle} />
            <Module state={state} module_type={module} />
        </main>
        )
}


