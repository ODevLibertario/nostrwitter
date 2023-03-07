import { Outlet, Link } from "react-router-dom";
import logo from '../resources/img/nostrwitter.png';

const Layout = () => {
    return (
        <div>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '10vh', marginTop: '2%'}}>
                <img src={logo} width={'50%'}/>
            </div>
            <Outlet />
        </div>
    )
};

export default Layout;