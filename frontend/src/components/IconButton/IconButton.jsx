import styles from "./styles.module.scss";

const IconButton = ({ icon, onClick }) => {
  return (
    <button className={styles["gsi-material-button"]} onClick={onClick}>
      <div className={styles["gsi-material-button-state"]}></div>
      <div className={styles["gsi-material-button-content-wrapper"]}>
        <div className={styles["gsi-material-button-icon"]}>
          {icon}
        </div>
      </div>
    </button>
  )
}

export default IconButton;
