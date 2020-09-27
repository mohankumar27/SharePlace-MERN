import React, { useEffect, useState, Fragment } from "react";

import UsersList from "../components/UsersList/UsersList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hooks";

function Users() {
  const [loadedUsers, setLoadedUsers] = useState();

  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  useEffect(() => {
    const getUsers = async () => {
      try {
        const resData = await sendRequest(
          process.env.REACT_APP_BACKEND_URL + "/users/"
        );
        setLoadedUsers(resData.allUsers);
      } catch (err) {}
    };
    getUsers();
  }, [sendRequest]);

  return (
    <Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
    </Fragment>
  );
}

export default Users;
