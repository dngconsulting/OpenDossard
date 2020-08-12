import {Menu, MenuItem, withStyles} from "@material-ui/core";


const DropdownMenu = withStyles({
    list: {
        padding: '0px'
    }
})(Menu);

const DropdownMenuItem = withStyles({
    root: {
        fontSize:'12px',
        backgroundColor:'#717272 !important',
        color: 'white'
    }
})(MenuItem);

export {DropdownMenu, DropdownMenuItem};