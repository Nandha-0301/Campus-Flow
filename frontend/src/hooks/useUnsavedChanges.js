import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const useUnsavedChanges = (shouldBlock, message = "You have unsaved changes. Do you really want to leave?") => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastLocationRef = useRef(location);
  const skipPromptRef = useRef(false);

  useEffect(() => {
    if (!shouldBlock) {
      lastLocationRef.current = location;
      return;
    }

    if (skipPromptRef.current) {
      skipPromptRef.current = false;
      lastLocationRef.current = location;
      return;
    }

    if (location.key !== lastLocationRef.current.key) {
      const confirmed = window.confirm(message);
      if (confirmed) {
        lastLocationRef.current = location;
      } else {
        skipPromptRef.current = true;
        navigate(-1);
      }
    }
  }, [location, navigate, shouldBlock, message]);

  useEffect(() => {
    if (!shouldBlock) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock, message]);
};

export default useUnsavedChanges;
