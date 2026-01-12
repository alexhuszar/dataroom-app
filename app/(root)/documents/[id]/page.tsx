import { IframePdfDocument } from "@/components/IframePdfDocument";

const Document = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) => {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const fileId = params.id;
  const { title } = searchParams;

  return <IframePdfDocument fileId={fileId} fileName={title} />;
};

export default Document;
