import React, { useContext, Fragment } from "react";
import { useHistory } from "react-router-dom";

import "./PlaceForm.css";
import Input from "../../shared/components/FormElements/Input/Input";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH,
} from "../../shared/util/Validators";
import { useForm } from "../../shared/hooks/form-hooks";
import { useHttpClient } from "../../shared/hooks/http-hooks";
import Button from "../../shared/components/FormElements/Button/Button";
import { AuthContext } from "../../shared/context/auth-context";
import ErrorModal from "../../shared/components/UIElements/ErrorModal/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner/LoadingSpinner";
import ImageUpload from "../../shared/components/FormElements/ImageUpload/ImageUpload";

function NewPlace() {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [formState, inputHandler] = useForm(
    {
      title: {
        value: "",
        isValid: false,
      },
      description: {
        value: "",
        isValid: false,
      },
      image: {
        value: null,
        isValid: false,
      },
      address: {
        value: "",
        isValid: false,
      },
    },
    false
  );

  const history = useHistory();

  const placeSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", formState.inputs.title.value);
      formData.append("description", formState.inputs.description.value);
      formData.append("address", formState.inputs.address.value);
      formData.append("image", formState.inputs.image.value);
      await sendRequest(
        process.env.REACT_APP_BACKEND_URL + "/places/",
        "POST",
        formData,
        {
          Authorization: "Bearer " + auth.token,
        }
      );
      history.push(`/${auth.userId}/places`);
    } catch (err) {}
  };

  return (
    <Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <form className="place-form" onSubmit={placeSubmitHandler}>
        {isLoading && <LoadingSpinner asOverlay />}
        <Input
          id="title"
          type="text"
          label="Title"
          element="input"
          errorText="please enter a valid title"
          validators={[VALIDATOR_REQUIRE()]}
          onInput={inputHandler}
        />
        <Input
          id="description"
          label="Description"
          element="textarea"
          errorText="please enter a valid description (at least 5 characters)"
          validators={[VALIDATOR_MINLENGTH(5)]}
          onInput={inputHandler}
        />
        <ImageUpload
          center
          onInput={inputHandler}
          id="image"
          errorText="Please provide and image"
        />
        <Input
          id="address"
          label="Address"
          element="input"
          errorText="please enter a valid address"
          validators={[VALIDATOR_REQUIRE()]}
          onInput={inputHandler}
        />
        <Button type="submit" disabled={!formState.isValid}>
          ADD PLACE
        </Button>
      </form>
    </Fragment>
  );
}

export default NewPlace;
