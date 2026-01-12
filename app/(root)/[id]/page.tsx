import Dashboard from "@/components/Dashboard";

const DashboardPage = async ({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) => {
  const { id } = await params;

  return <Dashboard key={`folder-${id}`} title="Home" />;
};

export default DashboardPage;