import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

// Define props type
type LoadingDialogProps = {
  loading: boolean;
  message?: string; // Optional message prop
};

const LoadingDialog = ({
  loading,
  message = "Hold on, magic is happening...",
}: LoadingDialogProps) => {
  if (!loading) return null; // Don't render if not loading

  return (
    <AlertDialog open={loading}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="flex flex-col items-center p-6 md:p-10 text-center">
          <AlertDialogTitle className="text-xl md:text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
            {message}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto">
              {" "}
              {/* Sized container for GIF */}
              <Image
                src={"/rocket.gif"} // Ensure this GIF is in your public folder
                alt="AI generating content..."
                layout="fill" // Use fill to make it responsive within the container
                objectFit="contain" // Or "cover" depending on GIF aspect ratio
                priority // If it's a crucial loading indicator
                unoptimized // GIFs are often already optimized
              />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              This might take a few moments. Please don&apos;t close this window.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoadingDialog;
