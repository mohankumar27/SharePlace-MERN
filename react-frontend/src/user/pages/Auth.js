import React, { useState, useContext, Fragment } from "react";

import {
  VALIDATOR_EMAIL,
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH,
} from "../../shared/util/Validators";
import { useForm } from "../../shared/hooks/form-hooks";
import Input from "../../shared/components/FormElements/Input/Input";
import Button from "../../shared/components/FormElements/Button/Button";
import Card from "../../shared/components/UIElements/Card/Card";
import { AuthContext } from "../../shared/context/auth-context";
import "./Auth.css";
import ErrorModal from "../../shared/components/UIElements/ErrorModal/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hooks";
import ImageUpload from "../../shared/components/FormElements/ImageUpload/ImageUpload";

function Auth() {
  const auth = useContext(AuthContext);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [authState, inputHandler, setFormData] = useForm(
    {
      email: {
        value: "",
        isValid: false,
      },
      password: {
        value: "",
        isValid: false,
      },
    },
    false
  );

  const authSubmitHandler = async (event) => {
    event.preventDefault();
    if (isLoginMode) {
      try {
        const resData = await sendRequest(
          process.env.REACT_APP_BACKEND_URL + "/users/login",
          "POST",
          JSON.stringify({
            email: authState.inputs.email.value,
            password: authState.inputs.password.value,
          }),
          {
            "Content-Type": "application/json",
          }
        );
        auth.login(resData.userId, resData.token);
      } catch (err) {}
    } else {
      try {
        const formData = new FormData();
        formData.append("email", authState.inputs.email.value);
        formData.append("name", authState.inputs.name.value);
        formData.append("password", authState.inputs.password.value);
        formData.append("image", authState.inputs.image.value);
        const resData = await sendRequest(
          process.env.REACT_APP_BACKEND_URL + "/users/signup",
          "POST",
          formData
        );
        auth.login(resData.userId, resData.token);
      } catch (err) {}
    }
  };

  const switchModeHandler = () => {
    if (!isLoginMode) {
      setFormData(
        { ...authState.inputs, name: undefined, image: undefined },
        authState.inputs.email.isValid && authState.inputs.password.isValid
      );
    } else {
      setFormData(
        {
          ...authState.inputs,
          name: {
            value: "",
            isValid: false,
          },
          image: {
            value: null,
            isValid: false,
          },
        },
        false
      );
    }
    setIsLoginMode((prevMode) => !prevMode);
  };

  return (
    <Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <Card className="authentication">
        {isLoading && <LoadingSpinner asOverlay />}
        <h2>Login Required</h2>
        <hr />
        <form onSubmit={authSubmitHandler}>
          {!isLoginMode && (
            <Input
              element="input"
              type="text"
              id="name"
              label="User Name"
              validators={[VALIDATOR_REQUIRE()]}
              errorText="please enter a name"
              onInput={inputHandler}
            />
          )}
          {!isLoginMode && (
            <ImageUpload
              center
              onInput={inputHandler}
              id="image"
              errorText="Please provide and image"
            />
          )}
          <Input
            id="email"
            type="email"
            label="Email"
            element="input"
            errorText="please enter a valid email"
            validators={[VALIDATOR_REQUIRE(), VALIDATOR_EMAIL()]}
            onInput={inputHandler}
          />
          <Input
            id="password"
            type="password"
            label="Password"
            element="input"
            errorText="password must be atleast 6 characters"
            validators={[VALIDATOR_MINLENGTH(6)]}
            onInput={inputHandler}
          />
          <Button type="submit" disabled={!authState.isValid}>
            {isLoginMode ? "LOGIN" : "SIGN UP"}
          </Button>
        </form>
        <Button inverse onClick={switchModeHandler}>
          SWITCH TO {isLoginMode ? "SIGN UP" : "LOGIN"}
        </Button>
      </Card>
    </Fragment>
  );
}

export default Auth;
