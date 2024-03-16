import WalletMultiButton from "./wallet-multi-button";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/navbar";
import Link from "next/link";
import { Tooltip } from "@nextui-org/tooltip";
import Image from "next/image";
// import SolanaLogo from "../public/solanaLogo.svg";
import GemsDAOLogo from "../public/gems_dao_logo.png";
import { SolBalance } from "./SolBalance";

export function NavBar() {
  return (
    <Navbar>
      <NavbarBrand>
        <Image src={GemsDAOLogo} alt="Gems DAO Logo" width={100} />
      </NavbarBrand>
      {/* <NavbarItem >Vault</NavbarItem> */}
      <Link href="/vault">Vault</Link>
      <Link href="/marketplace">Marketplace</Link>
      <Link href="/perps">Perps</Link>
      <NavbarContent justify="end">
        <Tooltip content="Devnet Only">
          <NavbarItem>
            <WalletMultiButton />
          </NavbarItem>
        </Tooltip>
        <NavbarItem>
          <SolBalance />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
