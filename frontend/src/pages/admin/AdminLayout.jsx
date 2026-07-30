import React from "react";
import { Outlet } from "react-router-dom";
import Layout from "../../components/Layout";

const AdminLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

export default AdminLayout;
