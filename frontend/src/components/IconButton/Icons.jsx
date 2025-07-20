const GoogleIcon = () => {
  // https://developers.google.com/identity/branding-guidelines#render-html-button
  return (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{display: "block"}}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  )
}

const LogoutIcon = () => {
  // https://www.iconfinder.com/search?q=logout&price=free
  return (
    <svg viewBox="0 0 35 35" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.54,34.75a17.25,17.25,0,0,1,0-34.5,1.25,1.25,0,0,1,0,2.5,14.75,14.75,0,0,0,0,29.5,1.25,1.25,0,0,1,0,2.5Z"/>
      <path d="M32.927,18.75H15.25a1.25,1.25,0,0,1,0-2.5H32.927a1.25,1.25,0,0,1,0,2.5Z"/>
      <path d="M26.536,26.438a1.25,1.25,0,0,1-.884-2.134l6.384-6.385a.6.6,0,0,0,0-.839L25.652,10.7A1.25,1.25,0,1,1,27.42,8.929L33.8,15.313a3.1,3.1,0,0,1,0,4.374L27.42,26.072A1.246,1.246,0,0,1,26.536,26.438Z"/>
    </svg>
  )
}

export { GoogleIcon, LogoutIcon };
