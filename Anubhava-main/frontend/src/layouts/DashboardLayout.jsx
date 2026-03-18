import React, { useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Button,
  Input,
  Badge,
} from "antd";
import {
  DashboardOutlined,
  RocketOutlined,
  TrophyOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isQuizInProgress } = useAuth();

  const menuItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard", disabled: isQuizInProgress },
    { key: "/roadmap", icon: <RocketOutlined />, label: "My Roadmap", disabled: isQuizInProgress },
    { key: "/progress", icon: <TrophyOutlined />, label: "Progress", disabled: isQuizInProgress },
    { key: "/ai-assistant", icon: <MessageOutlined />, label: "AI Assistant", disabled: isQuizInProgress },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => navigate("/profile"),
    },
    { key: "settings", icon: <SettingOutlined />, label: "Settings" },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: logout,
    },
  ];

  const selectedMenuKey = useMemo(() => {
    const match = menuItems.find((item) =>
      location.pathname.startsWith(item.key),
    );
    return match ? [match.key] : ["/dashboard"];
  }, [location.pathname]);

  return (
    <Layout className="min-h-screen bg-[#F8F9FE]">
      {/* Sidebar - Styled with Demo Colors */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        theme="light"
        className="border-r border-gray-100 hidden md:block h-full"
        height="100%"
        style={{
          background: "#f7f7f7",
          height: "100vh",
        }}
      >
        <div className="flex items-center space-x-2 p-6 mb-4">
          <div className="w-8 h-8 bg-[#064e3b] rounded-lg flex items-center justify-center text-white font-bold">
            A
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-[#064e3b]">Anubhava</span>
          )}
        </div>

        <div className="px-4">
          {!collapsed && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-3">
              Menu
            </p>
          )}
          <Menu
            mode="inline"
            selectedKeys={selectedMenuKey}
            onClick={({ key }) => {
              const item = menuItems.find(m => m.key === key);
              if (!item?.disabled) {
                navigate(key);
              }
            }}
            items={menuItems}
            // className="border-none custom-sidebar-menu bg-[#e0e0e0]"
            style={{ backgroundColor: "#f6f6f6" }}
          />
        </div>
      </Sider>

      <Layout
        style={{
          backgroundColor: "white",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          style={{
            backgroundColor: "white",
            height: "80px",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "between",
            lineHeight: "64px",
            borderBottom: "1px solid #f0f0f0",
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center flex-1 max-w-md">
            <Button
              style={{
                color: "#064e3b",
              }}
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-lg"
            />
          </div>

          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-3 pl-4 border-l border-gray-200"
              style={{ borderLeft: "1px solid #e5e7eb" }}
            >
              <div className="text-right hidden sm:block">
                <p
                  className="text-sm font-bold m-0 leading-none"
                  style={{ margin: 0, lineHeight: 1 }}
                >
                  {user?.fullName || "Jason Ranti"}
                </p>
              </div>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar
                  size={44}
                  className="cursor-pointer border-2 border-white shadow-sm bg-emerald-100 text-emerald-800"
                  style={{
                    cursor: "pointer",
                    backgroundColor: "#d1fae5",
                    color: "#065f46",
                  }}
                >
                  {user?.firstName?.[0]?.toUpperCase() || "J"}
                </Avatar>
              </Dropdown>
            </div>
          </div>
        </Header>

        {/* Content Area */}
        <Content
          style={{
            flex: 1,
            paddingLeft: "2rem",
            paddingRight: "2rem",
            paddingBottom: "2rem",
            overflowY: "auto",
          }}
        >
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </Content>
      </Layout>

      {/* Basic CSS overrides to handle Ant Design's default menu styling */}
      <style>{`
        .custom-sidebar-menu.ant-menu-light .ant-menu-item-selected {
          background-color: #064e3b !important;
          color: white !important;
          border-radius: 12px;
        }
        .ant-menu-item {
          border-radius: 12px !important;
          margin-bottom: 4px !important;
        }
        .ant-menu-item-disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
        .ant-menu-inline { border-inline-end: none !important; }
      `}</style>
    </Layout>
  );
};

export default DashboardLayout;