import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Center, Flex, useMediaQuery } from "@chakra-ui/react";
import { Camera } from "react-camera-pro";
import { useRouter } from "next/router";
import type { AspectRatio } from "react-camera-pro/dist/components/Camera/types";

export default function CameraComponent() {
  const router = useRouter();
  const camera = useRef<React.RefObject<typeof Camera>>(null);
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [image, setImage] = useState<string>();
  const [mobileScreen] = useMediaQuery("(min-width: 600px)");
  const [ratio, setRatio] = useState<AspectRatio>(9 / 16);

  useEffect(() => {
    //set ratio camera
    if (mobileScreen) {
      setRatio(9 / 16);
    } else {
      setRatio("cover");
      // setRatio(9 / 16);
    }
  }, [mobileScreen, ratio]);

  const capture = () => {
    const imageSrc = (camera.current as any)?.takePhoto();
    rotateImage(imageSrc, 90, (image) => {
      setImage(image);
      localStorage.setItem("myPhoto", image);
      router.push("/dashboard");
    });
  };

  const rotateImage = (
    imageBase64: string,
    rotation: number,
    cb: (transformedImage: string) => void
  ) => {
    var img = new Image();
    img.src = imageBase64;
    img.onload = () => {
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
      }
      cb(canvas.toDataURL("image/jpeg"));
    };
  };

  const cameraMarking = {
    position: "absolute",
    width: "100%",
    height: "100%",
    // "background-position": "center",
    top: "0",
  };

  const cameraErrorMessages = {
    noCameraAccessible: "No camera is accessible.",
    permissionDenied: "Permission to the camera was denied.",
    switchCamera: "Failed to switch camera.",
    canvas: "Canvas error.",
  };

  return (
    <Box
      bgImage={{ base: "none", md: "/112.png", lg: "/112.png" }}
      bgPosition="center"
      bgSize="cover"
      h="100vh"
    >
      <Center>
        <Box
          maxW="sm"
          mt={{ base: "0px", md: "10px", lg: "10px" }}
          height={{ base: "100%", md: "50%", lg: "25%" }}
          width={{ base: "600px", md: "50%", lg: "25%" }}
          borderWidth={{ base: "0px", md: "1px", lg: "1px" }}
          bg="teal.400"
          justifyContent="center"
          overflow="hidden"
          position={{ lg: "relative" }}
          borderRadius="lg"
          rounded={{ base: "none", md: "24", lg: "24" }}
        >
          <Flex direction="column" background="white">
            <Center>
              <Camera
                ref={camera}
                numberOfCamerasCallback={setNumberOfCameras}
                facingMode="user"
                aspectRatio={ratio}
                errorMessages={cameraErrorMessages}
              />
              <img
                src="/favicons/icon.svg"
                width="70px"
                height="70px"
                alt="Logo"
                style={{
                  position: "absolute",
                  bottom: "10%",
                }}
                onClick={capture}
              />
            </Center>
          </Flex>
        </Box>
      </Center>
    </Box>
  );
}
