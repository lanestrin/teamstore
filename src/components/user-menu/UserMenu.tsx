import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuLogOut, LuUser } from "react-icons/lu";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./UserMenu.module.scss";

export default function UserMenu() {
	const { signOut } = useAuthActions();
	const user = useQuery(api.users.current);

	const [open, setOpen] = useState(false);

	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () =>
			document.removeEventListener(
				"mousedown",
				handleClickOutside
			);
	}, []);

	const initials =
		user?.name
			?.split(" ")
			.map(x => x[0])
			.join("")
			.toUpperCase()
		?? user?.email?.charAt(0).toUpperCase()
		?? "?";

	return (
		<div
			className={styles.userMenu}
			ref={menuRef}
		>
			<button
				type="button"
				className={styles.avatar}
				onClick={() => setOpen((open) => !open)}
				aria-label="User menu"
			>
				{initials}
			</button>

			{open && (
				<div className={styles.dropdown}>
					<Link
						to="/account"
						onClick={() => setOpen(false)}
					>
						<LuUser />
						Account
					</Link>

					<button
						onClick={() => {
							void signOut();
							setOpen(false);
						}}
					>
						<LuLogOut />
						Logout
					</button>
				</div>
			)}
		</div>
	);
}
