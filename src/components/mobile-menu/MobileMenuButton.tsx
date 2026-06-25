import React from "react"
import styles from './MobileMenuButton.module.scss'

interface MobileMenuButtonProps {
	isOpen: boolean
	onClick: () => void
}

function MobileMenuButton({
	isOpen,
	onClick
}: MobileMenuButtonProps) {
	return (
		<button
			aria-label="Toggle Navigation Menu"
			className={`${styles.mobileMenuButton} ${isOpen ? styles.mobileMenuButtonOpen : ''}`}
			onClick={onClick}
			type="button"
		>
			<span />
			<span />
			<span />
		</button>
	)
}

export default MobileMenuButton