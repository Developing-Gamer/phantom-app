import { LoadingIndicator } from "@/components/ui/loading-indicator";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingIndicator label="Loading..." size="sm" />
    </div>
  );
}
