import WalletMultiButton from "./wallet-multi-button";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/navbar";
import { Tooltip } from "@nextui-org/tooltip";
import Image from "next/image";
// import SolanaLogo from "../public/solanaLogo.svg";
import GemsDAOLogo from "../public/gems_dao_logo.png";
import { UserBalance } from "./UserBalance";

export function NavBar() {
  return (
    <Navbar>
      <NavbarBrand>
        <Image src={GemsDAOLogo} alt="Gems DAO Logo" width={100} />
      </NavbarBrand>
      <NavbarContent justify="end">
        <Tooltip content="Devnet Only">
          <NavbarItem>
            <WalletMultiButton />
          </NavbarItem>
        </Tooltip>
        <NavbarItem>{/* <UserBalance tokenSymbol="" /> */}</NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
