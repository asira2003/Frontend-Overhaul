import { useEffect, useState } from "react";
import {
  validateInputText,
  validateInputTextNoUpperCase,
} from "../utils/StringUtils";

export default function SearchFilterDropDown({
  dataList,
  value,
  handleChange,
  disabled,
}) {
  const [dataListState, setDataListState] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  useEffect(() => {
    setDataListState(() => {
      return [...dataList];
    });
    setSearchValue(() => "");
  }, [dataList]);

  const dropDownList = dataListState.map((data) => {
    return (
      <li key={data.id} onClick={() => handleChange(data.id)}>
        <span className="dropdown-item dropdown-item-mod">
          {data.description}
        </span>
      </li>
    );
  });
  return (
    <>
      <div className="btn-group dropdown-adjuster">
        <button
          className="form-select form-select-mod drop-down-toggle position-absolute"
          type="button"
          disabled={disabled || false}
          data-bs-toggle="dropdown"
          data-bs-auto-close="true"
          aria-expanded="false"
        >
          {dataListState.filter((data) => data.id === value)[0]?.description}
          &nbsp;
        </button>
        <ul className="dropdown-menu">
          <li>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-sm input-group-control-mod form-input-mod"
                placeholder="Search..."
                aria-describedby="basic-addon2"
                value={searchValue}
                onChange={(event) => {
                  const input = validateInputTextNoUpperCase(
                    event.target.value
                  );
                  setSearchValue(() => input);

                  const escapedInput = input.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  );

                  setDataListState(() => {
                    const newDataListState = dataList.filter((data) =>
                      data.description.match(
                        new RegExp(`.*${escapedInput}.*`, "i")
                      )
                    );
                    return newDataListState;
                  });
                }}
              />
              <span
                className="input-group-text input-group-text-mod form-input-mod"
                id="basic-addon2"
              >
                <span className="action-btn">
                  <i className="fa-sharp fa-solid fa-magnifying-glass fa-sm"></i>
                </span>
              </span>
            </div>
          </li>
          {dropDownList}
        </ul>
      </div>
    </>
  );
}
