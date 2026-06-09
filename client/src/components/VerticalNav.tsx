import styled from 'styled-components'

export type VerticalNavItem = {
  label: string
  href?: string
  onClick?: () => void
}

type VerticalNavProps = {
  title: string
  items: VerticalNavItem[]
}

const Nav = styled.nav`
  position: fixed;
  top: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 20;
  width: 208px;
  overflow-y: auto;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(16, 24, 40, 0.12);

  @media (max-width: 1180px) {
    position: sticky;
    top: 0;
    bottom: auto;
    left: auto;
    width: auto;
    border-radius: 0;
    border-right: 0;
    border-left: 0;
    box-shadow: none;
  }
`

const Title = styled.strong`
  display: block;
  margin-bottom: 12px;
  color: #111827;
  font-size: 14px;
`

const List = styled.div`
  display: grid;
  gap: 6px;

  @media (max-width: 1180px) {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
  }
`

const NavLink = styled.a`
  display: block;
  border-radius: 6px;
  padding: 8px 9px;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;

  &:hover,
  &:focus {
    background: #eef6ff;
    color: #0f4f8f;
    outline: none;
  }
`

const NavButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 6px;
  padding: 8px 9px;
  background: transparent;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus {
    background: #eef6ff;
    color: #0f4f8f;
    outline: none;
  }
`

export function VerticalNav({ title, items }: VerticalNavProps) {
  return (
    <Nav aria-label={title}>
      <Title>{title}</Title>
      <List>
        {items.map((item) =>
          item.href ? (
            <NavLink key={item.label} href={item.href}>
              {item.label}
            </NavLink>
          ) : (
            <NavButton key={item.label} type="button" onClick={item.onClick}>
              {item.label}
            </NavButton>
          ),
        )}
      </List>
    </Nav>
  )
}
