import { Box } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useScrollTrigger from '@mui/material/useScrollTrigger';

import IconButton from "../IconButton/IconButton.jsx";
import { GoogleIcon, LogoutIcon } from "../IconButton/Icons.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const login = async () => {
  window.location.href = `${API_URL}/auth/google`;
}

const logout = async () => {
  window.location.href = `${API_URL}/auth/logout`;
}

const NavBar = ({ user, setUser }) => {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ zIndex: 10 }} elevation={trigger ? 4 : 0}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: "white",
              fontWeight: "bold"
            }}
          >
            qfoos
          </Typography>
          {
            user ?
            <IconButton onClick={() => logout(setUser)} icon={<LogoutIcon />} /> :
            <IconButton onClick={() => login(setUser)} icon={<GoogleIcon />} />
          }
        </Toolbar>
      </AppBar>
      {/* Second toolbar to offset all other components to be below the navbar */}
      <Toolbar />
    </Box>
  )
};

export default NavBar;
