import {
  createStyles,
  FormControl, IconButton,
  makeStyles, Menu,
  MenuItem,
  TableCell,
  TableRow,
  Theme,
  Typography
} from '@material-ui/core'
import { ArrayHelpers, ErrorMessage, Field } from 'formik'
import { AsyncSelect, NestedErrorMessage } from '../../../utils/components'
import { MAP_TYPES, Option } from '../../../utils'
import { Select, TextField } from 'formik-material-ui'
import React, { useEffect, useState } from 'react'
import { Mapping } from '../types'
import api from '../api'
import { APISource } from '../../sources'
import {includes} from 'lodash';
import { MoreVert as MoreVertIcon, DeleteOutline as DeleteOutlineIcon } from '@material-ui/icons'

interface ConceptOption extends Option{
  displayName: string,
}

const buildEvent = (name: string, value?: any) => ({target: {name, value}});

const option = (value?: string, label?: string) => ({value, label});

const buildConceptLabel = (toConceptName?: string, toConceptUrl?: string) => (toConceptName && toConceptUrl) ? `${nameFromUrl(toConceptUrl)}- ${toConceptName}` : ''

export const isExternalSource = ({source_type: sourceType}: APISource) => includes(['External', 'externalDictionary'], sourceType);

const nameFromUrl = (url: string): string => {
  let letters = url.split('');
  letters.reverse();
  letters.splice(0, 1);
  letters.splice(letters.indexOf('/'));
  letters.reverse();

  return letters.join("");
}

interface SourceOption extends Option{
  isInternalSource: boolean,
}

interface SourceResults {
  options: SourceOption[],
  hasMore: boolean,
  additional: {
    page: number,
  }
}

const fetchSourceOptions = async (query: string, _:{}, {page}: {page: number}): Promise<SourceResults> => {
  try {
    const response = await api.retrievePublicSources(page, 10, query);
    const {data, headers: {next='None'}} = response;

    return {
      options: data.map((source: APISource) => {
        const {name, url} = source;

        return {
          label: name,
          value: url,
          isInternalSource: !isExternalSource(source),
        }
      }),
      hasMore: next !== 'None',
      additional: {
        page: page+1,
      },
    };
  } catch (e) {
    return {
      options: [],
      hasMore: false,
      additional: {
        page: 1,
      },
    };
  }
};

interface ConceptResults {
  options: ConceptOption[],
  hasMore: boolean,
  additional: {
    page: number,
  }
}

const fetchConceptOptions = async (sourceUrl: string, query: string, page: number): Promise<ConceptResults> => {
  try {
    const response = await api.concepts.retrieve(`${sourceUrl}concepts/`, page, 10, query);
    const {data, headers: {next='None'}} = response;

    return {
      options: data.map(({display_name, url}: {display_name: string, url: string}) => (
        {
          label: buildConceptLabel(display_name, url),
          value: url,
          displayName: display_name,
        })
      ),
      hasMore: next !== 'None',
      additional: {
        page: page+1,
      },
    };
  } catch (e) {
    return {
      options: [],
      hasMore: false,
      additional: {
        page: 1,
      },
    };
  }
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    row: {
      verticalAlign: 'top',
    },
    singleCellWidth: {
      width: '24%',
    },
    doubleCellWidth: {
      width: '48%',
    },
    fillParent: {
      width: '100%',
    },
    menuItem: {
      width: '4%',
    },
    errorContainer: {
      textAlign: 'center',
    },
  }),
);

interface Props {
  value: Mapping,
  index: number,
  valuesKey: string,
  handleChange: Function,
  toggleMenu: Function,
  menu: {index: number, anchor: null | HTMLElement},
  arrayHelpers: ArrayHelpers,
  fixedMappingType?: Option,
  errors?: any,
  editing: boolean,
}

const MappingsTableRow: React.FC<Props> = ({value, index, valuesKey, handleChange, toggleMenu, menu, arrayHelpers, fixedMappingType, errors, editing}) => {
  const classes = useStyles();

  const {to_source_url: toSourceUrl, to_concept_url: toConceptUrl, to_concept_name: toConceptName, to_concept_code: toConceptCode, url} = value;
  const valueKey = `${valuesKey}[${index}]`;
  const conceptLabel = buildConceptLabel(toConceptName, toConceptUrl);

  const [isInternalMapping, setIsInternalMapping] = useState(toConceptUrl !== null);

  // reset to_concept on to_source change
  useEffect(() => {
    handleChange(buildEvent( `${valueKey}.to_concept_url`, undefined));
    handleChange(buildEvent( `${valueKey}.to_concept_code`, undefined));
    handleChange(buildEvent( `${valueKey}.to_concept_name`, undefined));
  }, [toSourceUrl]);

  // update default map_type
  useEffect(() => {
    if (!fixedMappingType) handleChange(buildEvent( `${valueKey}.map_type`, MAP_TYPES[isInternalMapping ? 0 : 1].value));
  }, [isInternalMapping]);

  // update map_type from fixed map_type
  useEffect(() => {
    if (fixedMappingType) handleChange(buildEvent( `${valueKey}.map_type`, fixedMappingType.value));
  }, [fixedMappingType]);

  return (
    <>
      <TableRow className={classes.row}>
        <TableCell className={fixedMappingType ? classes.doubleCellWidth : classes.singleCellWidth} component="td" scope="row">
          <FormControl
            fullWidth
            margin="dense"
          >
            <Field
              id={`${valueKey}.to_source_url`}
              name={`${valueKey}.to_source_url`}
              component={AsyncSelect}
              onChange={(option: SourceOption | null) => {
                if (option) {
                  handleChange(buildEvent( `${valueKey}.to_source_url`, option.value));
                  setIsInternalMapping(option.isInternalSource);
                } else {
                  handleChange(buildEvent( `${valueKey}.to_source_url`, undefined));
                  setIsInternalMapping(true);
                }
              }}
              value={toSourceUrl ? option(toSourceUrl, nameFromUrl(toSourceUrl)) : undefined}
              placeholder="Select a source"
              loadOptions={fetchSourceOptions}
              additional={{page: 1}}
              isDisabled={!editing}
            />
            <Typography color="error" variant="caption" component="div">
              <NestedErrorMessage name={`${valueKey}.to_source_url`}/>
            </Typography>
          </FormControl>
        </TableCell>

        {fixedMappingType ? null : (
          <TableCell className={classes.singleCellWidth} component="td" scope="row">
            <FormControl
              fullWidth
              margin="dense"
            >
              <Field
                id={`${valueKey}.map_type`}
                name={`${valueKey}.map_type`}
                component={Select}
              >
                {MAP_TYPES.map(mapType => (
                  <MenuItem
                    key={mapType.value}
                    value={mapType.value}
                  >
                    {mapType.label}
                  </MenuItem>
                ))}
              </Field>
              <Typography color="error" variant="caption" component="div">
                <NestedErrorMessage name={`${valueKey}.map_type`}/>
              </Typography>
            </FormControl>
          </TableCell>
        )}

        {isInternalMapping ? (
          <TableCell className={classes.doubleCellWidth} component="td" scope="row">
            <FormControl
              fullWidth
              margin="dense"
            >
              <Field
                id={`${valueKey}.to_concept_url`}
                name={`${valueKey}.to_concept_url`}
                component={AsyncSelect}
                onChange={(option: ConceptOption | null) => {
                  if (option) {
                    handleChange(buildEvent( `${valueKey}.to_concept_url`, option.value))
                    handleChange(buildEvent( `${valueKey}.to_concept_name`, option.displayName))
                  } else {
                    handleChange(buildEvent( `${valueKey}.to_concept_url`, undefined))
                    handleChange(buildEvent( `${valueKey}.to_concept_name`, undefined))
                  }
                }}
                value={toConceptUrl ? option(toConceptUrl, conceptLabel) : undefined}
                placeholder="Select a concept"
                isDisabled={!editing || !toSourceUrl}
                loadOptions={
                  async (query: string, _:{}, {page}: {page: number}) => {
                    if (!toSourceUrl) return {
                      options: [],
                      hasMore: false,
                      additional: {
                        page: 1,
                      },
                    };
                    return fetchConceptOptions(toSourceUrl, query, page);
                  }
                }
                additional={{page: 1}}
                cacheUniq={toSourceUrl}
              />
            </FormControl>
          </TableCell>
        ) : (
          <TableCell className={classes.doubleCellWidth} component="td" scope="row">
            <Field
              fullWidth
              id={`${valueKey}.to_concept_code`}
              name={`${valueKey}.to_concept_code`}
              placeholder="To concept code"
              margin="dense"
              component={TextField}
            />
            <br/>
            <Field
              fullWidth
              id={`${valueKey}.to_concept_name`}
              name={`${valueKey}.to_concept_name`}
              placeholder="To concept name"
              margin="dense"
              component={TextField}
            />
          </TableCell>
        )}
        <TableCell className={classes.menuItem} component="td" scope="row">
          {!editing ? '' : (
            <IconButton id={`${valueKey}.menu-icon`} aria-controls={`${valueKey}.menu`} aria-haspopup="true" onClick={event => toggleMenu(index, event)}>
              <MoreVertIcon />
            </IconButton>
          )}
          <Menu
            anchorEl={menu.anchor}
            id={`${valuesKey}[${index}].menu`}
            open={index === menu.index}
            onClose={() => toggleMenu(index)}
          >
            {url ? (
              <MenuItem onClick={() => {handleChange(buildEvent( `${valueKey}.retired`, true)); toggleMenu(index);}}><DeleteOutlineIcon /> Retire</MenuItem>
            ) : (
              <MenuItem onClick={() => {arrayHelpers.remove(index); toggleMenu(index);}}><DeleteOutlineIcon /> Delete</MenuItem>
            )}
          </Menu>
        </TableCell>
      </TableRow>
      {typeof errors !== 'string' ? null : (
        <Typography className={classes.errorContainer} color="error" variant="caption" component="tr">
          <td/>
          {fixedMappingType ? null : <td />}
          <ErrorMessage name={valueKey} component="td"/>
        </Typography>
      )}
    </>
  )
}


export default MappingsTableRow;