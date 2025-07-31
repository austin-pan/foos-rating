import { useContext } from "react";

import { Box } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useScrollTrigger from '@mui/material/useScrollTrigger';

import IconButton from "../IconButton/IconButton.jsx";
import { GoogleIcon, LogoutIcon } from "../IconButton/Icons.jsx";
import { AuthContext } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const handleLogin = async () => {
  window.location.href = `${API_URL}/auth/google`;
}

const NavBar = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ zIndex: 2000 }} elevation={trigger ? 4 : 0}>
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
            // Reload isn't necessary but gives feedback for logging out
            <IconButton onClick={() => {logout(); window.location.reload(false);}} icon={<LogoutIcon />} /> :
            <IconButton onClick={() => handleLogin(setUser)} icon={<GoogleIcon />} />
          }
        </Toolbar>
      </AppBar>
      {/* Second toolbar to offset all other components to be below the navbar */}
      <Toolbar />
    </Box>
  )
};

export default NavBar;
