import React from 'react'
import logo from '../../../Images/logo-coachs-assistant.png'
import { FiShoppingCart, FiX } from 'react-icons/fi'
import styles from './MobileDrawer.module.scss'

interface MobileDrawerProps {
	isOpen: boolean
	onClose: () => void
}

function MobileDrawer({
	isOpen,
	onClose
}: MobileDrawerProps) {

	const handleManageLockerRoomClick = (
		event: React.MouseEvent<HTMLAnchorElement>,
	) => {
		event.preventDefault()

		window.location.href = '/Account/Login'
	}

	return (
		<>
			<div
				className={[
					styles.mobileDrawerOverlay,
					isOpen ? styles.mobileDrawerOverlayVisible : ''
				].join(' ')}
				onClick={onClose}
			/>

			<div
				className={[
					styles.mobileDrawer,
					isOpen ? styles.mobileDrawerOpen : ''
				].join(' ')}
			>
				<div className={styles.mobileDrawerHeader}>
					<img
						alt="Coach's Assistant"
						src={logo}
					/>

					<button
						aria-label="Close Menu"
						onClick={onClose}
						type="button"
					>
						<FiX />
					</button>
				</div>

				<div className={styles.mobileDrawerAccountActions}>
					<button
						className="button button--ghost"
						type="button"
					>
						Log In
					</button>

					<button
						className="button button--primary"
						type="button"
					>
						My Account
					</button>

					<button
						className="button button--orange"
						type="button"
					>
						<span>My Cart</span>
						<FiShoppingCart className={styles.mobileDrawerCartIcon} />
					</button>
				</div>

				<nav className={styles.mobileDrawerNavigation}>
					<a href="/">
						Home
					</a>

					<a href="/LockerRoom/Create">
						Build Your Locker Room
					</a>

					<a href="/Search/SearchLockers">
						Find A Locker
					</a>

					<a
						href="#"
						onClick={handleManageLockerRoomClick}
					>
						Manage Locker Room
					</a>

					<a href="/Service/HowItWorks">
						How It Works
					</a>

					<a
						href="https://championteamwear.com/ContactUs.aspx#contactForm"
						target="_blank"
						rel="noopener noreferrer"
					>
						Contact Us
					</a>
				</nav>
			</div>
		</>
	)
}

export default MobileDrawer