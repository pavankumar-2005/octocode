import { Link, useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

// Top bar for the landing and projects pages: logo, theme switch, account menu.
export default function TopNav() {
  const { account, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
      <Logo />
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {account ? (
          <>
            <Button as={Link} to="/projects" size="sm" variant="flat" className="hidden sm:flex">
              My projects
            </Button>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar as="button" size="sm" name={account.name} className="bg-brand text-white" />
              </DropdownTrigger>
              <DropdownMenu aria-label="Account">
                <DropdownItem key="me" isReadOnly description={account.email} className="opacity-100">
                  {account.name}
                </DropdownItem>
                <DropdownItem key="projects" onPress={() => navigate("/projects")}>
                  My projects
                </DropdownItem>
                <DropdownItem key="logout" color="danger" className="text-danger" onPress={handleSignOut}>
                  Sign out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </>
        ) : (
          <Button as={Link} to="/login" size="sm" variant="flat">
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
